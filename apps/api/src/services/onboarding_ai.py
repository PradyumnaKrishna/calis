import json
import re
from typing import Any

import httpx
from pydantic import ValidationError

from ..core.config import GEMINI_API_KEY, GEMINI_MODEL
from ..models import Level
from ..schemas import (
    AnswerValue,
    OnboardingAssessment,
    OnboardingOption,
    OnboardingQuestion,
)

ALLOWED_EQUIPMENT = {"none", "pullup_bar", "parallettes", "rings", "bands"}
ALLOWED_CONSTRAINTS = {"wrists", "shoulders", "knees", "lower_back"}


def generate_onboarding_questions(
    answers: dict[str, AnswerValue],
) -> list[OnboardingQuestion]:
    if GEMINI_API_KEY:
        questions = _generate_questions_with_gemini(answers)

        if questions is not None:
            return questions

    return _fallback_questions(answers)


def assess_onboarding(answers: dict[str, AnswerValue]) -> OnboardingAssessment:
    if GEMINI_API_KEY:
        assessment = _assess_with_gemini(answers)

        if assessment is not None:
            return _sanitize_assessment(assessment)

    return _fallback_assessment(answers)


def _generate_questions_with_gemini(
    answers: dict[str, AnswerValue],
) -> list[OnboardingQuestion] | None:
    prompt = f"""
You are Calis, a concise calisthenics onboarding coach.

The user has answered these onboarding questions:
{json.dumps(answers)}

Generate 0 to 5 follow-up questions that help assign a safe starting level and
normalize plan inputs. Questions can be text, select, or multi_select.
Include equipment, training availability, and discomfort constraints unless the
user already answered them clearly. Use optional questions only when the answer
is useful but not required to complete onboarding.

Use stable snake_case ids. Option ids must be stable snake_case values.
Every question with guidance must include:
- hintSummary: one short sentence for the collapsed hint surface.
- hintDescription: the full explanation shown when the user opens the hint.
Do not ask for medical diagnosis. Pain/discomfort questions must be conservative.
"""
    schema = {
        "type": "object",
        "properties": {
            "questions": {
                "type": "array",
                "items": OnboardingQuestion.model_json_schema(),
            }
        },
        "required": ["questions"],
    }
    data = _call_gemini_json(prompt, schema)

    if data is None:
        return None

    try:
        return [OnboardingQuestion.model_validate(item) for item in data["questions"]]
    except (KeyError, TypeError, ValidationError):
        return None


def _assess_with_gemini(
    answers: dict[str, AnswerValue],
) -> OnboardingAssessment | None:
    prompt = f"""
You are Calis, a calisthenics onboarding assessor.

Assign one starting level: foundation, beginner, intermediate, or advanced.
Use the user's onboarding answers. Prefer a conservative level when pain,
uncertainty, or uneven ability is present.

Normalize these fields:
- goal: short snake_case goal category, such as general_fitness, strength,
  pullups, handstand, mobility, skill_work, or muscle_up.
- trainingDays: integer 1 through 4.
- equipment: only values from pullup_bar, parallettes, rings, bands.
- constraints: only values from wrists, shoulders, knees, lower_back.

Onboarding answers JSON: {json.dumps(answers)}
"""
    data = _call_gemini_json(prompt, OnboardingAssessment.model_json_schema())

    if data is None:
        return None

    try:
        return OnboardingAssessment.model_validate(data)
    except ValidationError:
        return None


def _call_gemini_json(prompt: str, schema: dict[str, Any]) -> dict[str, Any] | None:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseFormat": {
                "text": {
                    "mimeType": "application/json",
                    "schema": schema,
                }
            }
        },
    }

    try:
        response = httpx.post(
            url,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY or "",
            },
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        body = response.json()
        text = body["candidates"][0]["content"]["parts"][0]["text"]

        return json.loads(text)
    except (httpx.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError):
        return None


def _fallback_questions(answers: dict[str, AnswerValue]) -> list[OnboardingQuestion]:
    questions = [
        OnboardingQuestion(
            id="training_days",
            type="select",
            label="How many days per week do you want to train?",
            hint="This controls weekly pacing, not how advanced your starting plan is.",
            hintSummary="Choose a weekly pace you can repeat.",
            hintDescription=(
                "This controls weekly pacing, not how advanced your starting plan is."
            ),
            options=[
                OnboardingOption(id="days_1", label="1 day"),
                OnboardingOption(id="days_2", label="2 days"),
                OnboardingOption(id="days_3", label="3 days"),
                OnboardingOption(id="days_4", label="4+ days"),
            ],
        ),
        OnboardingQuestion(
            id="equipment",
            type="multi_select",
            label="What equipment can you use consistently?",
            hint="The plan will avoid progressions that need equipment you do not have.",
            hintSummary="Select only equipment you can use consistently.",
            hintDescription=(
                "The plan will avoid progressions that need equipment you do not have."
            ),
            required=False,
            options=[
                OnboardingOption(id="pullup_bar", label="Pull-up bar"),
                OnboardingOption(id="parallettes", label="Parallettes"),
                OnboardingOption(id="rings", label="Rings"),
                OnboardingOption(id="bands", label="Resistance bands"),
            ],
        ),
        OnboardingQuestion(
            id="constraints",
            type="multi_select",
            label="Is anything uncomfortable or risky right now?",
            hint="This keeps the first plan conservative around sensitive joints or positions.",
            hintSummary="Flag discomfort so the plan avoids risky starting points.",
            hintDescription=(
                "This keeps the first plan conservative around sensitive joints or positions."
            ),
            required=False,
            options=[
                OnboardingOption(id="wrists", label="Wrists"),
                OnboardingOption(id="shoulders", label="Shoulders"),
                OnboardingOption(id="knees", label="Knees"),
                OnboardingOption(id="lower_back", label="Lower back"),
            ],
        ),
    ]
    text = _answers_text(answers)

    if not any(term in text for term in ["push", "pull", "squat", "hang"]):
        questions.insert(
            0,
            OnboardingQuestion(
                id="baseline_strength",
                type="select",
                label="Which baseline best describes you today?",
                hint="Choose the option that best matches clean, comfortable reps.",
                hintSummary="Pick the closest clean-rep baseline.",
                hintDescription=(
                    "Choose the option that best matches clean, comfortable reps."
                ),
                options=[
                    OnboardingOption(
                        id="new_to_training", label="New to strength work"
                    ),
                    OnboardingOption(id="some_basics", label="Some push-ups or squats"),
                    OnboardingOption(
                        id="solid_basics",
                        label="Solid basics across patterns",
                    ),
                    OnboardingOption(
                        id="advanced_basics",
                        label="Strong basics and skills",
                    ),
                ],
            ),
        )

    return questions


def _fallback_assessment(answers: dict[str, AnswerValue]) -> OnboardingAssessment:
    text = _answers_text(answers)
    baseline = _single_answer(answers, "baseline_strength")

    if baseline == "advanced_basics" or _mentions(
        text,
        "muscle up",
        "front lever",
        "one arm",
        "30 push",
    ):
        level = Level.ADVANCED
    elif baseline == "solid_basics" or _mentions(
        text,
        "pull-up",
        "pullup",
        "dips",
        "handstand",
        "15 push",
    ):
        level = Level.INTERMEDIATE
    elif baseline == "some_basics" or _mentions(
        text,
        "push-up",
        "pushup",
        "squat",
        "hang",
    ):
        level = Level.BEGINNER
    else:
        level = Level.FOUNDATION

    constraints = _constraints_from_answers(answers)

    if constraints and level == Level.ADVANCED:
        level = Level.INTERMEDIATE

    return OnboardingAssessment(
        level=level,
        goal=_goal_from_text(str(answers.get("goal") or "")),
        training_days=_training_days(answers),
        equipment=_equipment_from_answers(answers),
        constraints=constraints,
        rationale="Local fallback assessment used because Gemini is not configured.",
    )


def _sanitize_assessment(assessment: OnboardingAssessment) -> OnboardingAssessment:
    equipment = [item for item in assessment.equipment if item in ALLOWED_EQUIPMENT]
    constraints = [
        item for item in assessment.constraints if item in ALLOWED_CONSTRAINTS
    ]

    return assessment.model_copy(
        update={
            "training_days": max(1, min(assessment.training_days, 4)),
            "equipment": equipment or ["none"],
            "constraints": constraints,
        }
    )


def _single_answer(answers: dict[str, AnswerValue], key: str) -> str | None:
    value = answers.get(key)

    if isinstance(value, str):
        return value

    if isinstance(value, list) and value:
        return value[0]

    return None


def _list_answer(answers: dict[str, AnswerValue], key: str) -> list[str]:
    value = answers.get(key)

    if isinstance(value, list):
        return value

    if isinstance(value, str):
        return [value]

    return []


def _training_days(answers: dict[str, AnswerValue]) -> int:
    answer = _single_answer(answers, "training_days") or ""
    match answer:
        case "days_1":
            return 1
        case "days_2":
            return 2
        case "days_4" | "days_4_plus":
            return 4
        case _:
            return 3


def _equipment_from_answers(answers: dict[str, AnswerValue]) -> list[str]:
    equipment = [
        item for item in _list_answer(answers, "equipment") if item in ALLOWED_EQUIPMENT
    ]

    return equipment or ["none"]


def _constraints_from_answers(answers: dict[str, AnswerValue]) -> list[str]:
    return [
        item
        for item in _list_answer(answers, "constraints")
        if item in ALLOWED_CONSTRAINTS
    ]


def _goal_from_text(goal: str) -> str:
    text = goal.lower()

    if _mentions(text, "pull-up", "pullup", "pull up"):
        return "pullups"

    if _mentions(text, "handstand", "hand stand"):
        return "handstand"

    if _mentions(text, "mobility", "flexibility"):
        return "mobility"

    if _mentions(text, "strength", "stronger"):
        return "strength"

    if _mentions(text, "muscle-up", "muscle up"):
        return "muscle_up"

    slug = re.sub(r"[^a-z0-9]+", "_", goal.lower()).strip("_")

    return slug[:48] or "general_fitness"


def _answers_text(answers: dict[str, AnswerValue]) -> str:
    parts: list[str] = []

    for value in answers.values():
        if isinstance(value, list):
            parts.extend(value)
        else:
            parts.append(value)

    return " ".join(parts).lower()


def _mentions(text: str, *needles: str) -> bool:
    return any(needle in text for needle in needles)
