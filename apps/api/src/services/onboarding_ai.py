import json

from pydantic import ValidationError

from ..core.config import GEMINI_API_KEY
from ..models import Level
from ..schemas import (
    AnswerValue,
    OnboardingAssessment,
    OnboardingQuestion,
)
from .gemini import generate_json

ALLOWED_EQUIPMENT = {"none", "pullup_bar", "parallettes", "rings", "bands"}
ALLOWED_CONSTRAINTS = {"wrists", "shoulders", "knees", "lower_back"}
ONBOARDING_QUESTION_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "type": {"type": "string", "enum": ["text", "select", "multi_select"]},
        "label": {"type": "string"},
        "hint": {"type": "string"},
        "hintSummary": {"type": "string"},
        "hintDescription": {"type": "string"},
        "required": {"type": "boolean"},
        "options": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "label": {"type": "string"},
                },
                "required": ["id", "label"],
            },
        },
    },
    "required": [
        "id",
        "type",
        "label",
        "hint",
        "hintSummary",
        "hintDescription",
        "required",
        "options",
    ],
}
ONBOARDING_QUESTIONS_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": ONBOARDING_QUESTION_SCHEMA,
        }
    },
    "required": ["questions"],
}
ONBOARDING_ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "level": {
            "type": "string",
            "enum": [
                Level.FOUNDATION,
                Level.BEGINNER,
                Level.INTERMEDIATE,
                Level.ADVANCED,
            ],
        },
        "goal": {"type": "string"},
        "trainingDays": {"type": "integer"},
        "equipment": {
            "type": "array",
            "items": {
                "type": "string",
                "enum": sorted(ALLOWED_EQUIPMENT),
            },
        },
        "constraints": {
            "type": "array",
            "items": {
                "type": "string",
                "enum": sorted(ALLOWED_CONSTRAINTS),
            },
        },
        "rationale": {"type": "string"},
    },
    "required": [
        "level",
        "goal",
        "trainingDays",
        "equipment",
        "constraints",
        "rationale",
    ],
}


class OnboardingAIError(RuntimeError):
    pass


def generate_onboarding_questions(
    answers: dict[str, AnswerValue],
) -> list[OnboardingQuestion]:
    if not GEMINI_API_KEY:
        raise OnboardingAIError("Gemini is not configured.")

    questions = _generate_questions_with_gemini(answers)

    if questions is None:
        raise OnboardingAIError("Gemini failed to generate onboarding questions.")

    return questions


def assess_onboarding(answers: dict[str, AnswerValue]) -> OnboardingAssessment:
    if not GEMINI_API_KEY:
        raise OnboardingAIError("Gemini is not configured.")

    assessment = _assess_with_gemini(answers)

    if assessment is None:
        raise OnboardingAIError("Gemini failed to assess onboarding answers.")

    return _sanitize_assessment(assessment)


def _generate_questions_with_gemini(
    answers: dict[str, AnswerValue],
) -> list[OnboardingQuestion] | None:
    prompt = f"""
You are Calis, a concise calisthenics onboarding coach.

The user has answered these onboarding questions:
{json.dumps(answers)}

Generate 0 to 6 follow-up questions that collect enough information to assign a
safe calisthenics starting level and normalize plan inputs.

The final assessment must understand:
- what issues, pain, discomfort, or movement restrictions the user has;
- how many days per week the user can train consistently;
- current ability in core patterns like push-ups, pulling or hanging, squats,
  core control, and relevant skill experience;
- available equipment;
- any other relevant context needed to choose whether the user should start
  from basic progressions like learning push-ups or from a later stage.

Questions can be text, select, or multi_select. Ask your own adaptive questions
based on the user's answers, but do not ask for anything already answered
clearly. Required questions should be limited to information needed for the
assessment. Use optional questions only when useful but not required.

Use stable snake_case ids. Option ids must be stable snake_case values.
Every question with guidance must include:
- hintSummary: one short sentence for the collapsed hint surface.
- hintDescription: the full explanation shown when the user opens the hint.
Do not ask for medical diagnosis. Pain/discomfort questions must be conservative.
Return no follow-up questions only when the answers already cover ability,
issues, training days, and equipment clearly enough for assessment.
"""
    data = generate_json(prompt, ONBOARDING_QUESTIONS_RESPONSE_SCHEMA)

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

Level rubric:
- foundation: new to training, cannot do clean basic reps yet, needs to learn
  very basic push-up, squat, hinge, brace, or hanging progressions, or has
  discomfort that requires a very conservative start.
- beginner: can do some basics, such as incline/knee/full push-ups, squats, or
  short hangs, but still needs standard progressions and low-to-moderate volume.
- intermediate: has reliable basics across push, pull, legs, and core, and can
  begin goal-specific progressions such as pull-ups, dips, handstand prep, or
  harder variations.
- advanced: already strong across basics and wants harder skill work such as
  muscle-ups, levers, one-arm work, advanced handstand work, or high-volume
  strength training.

Normalize these fields:
- goal: short snake_case goal category, such as general_fitness, strength,
  pullups, handstand, mobility, skill_work, or muscle_up.
- trainingDays: integer 1 through 4.
- equipment: only values from none, pullup_bar, parallettes, rings, bands.
- constraints: only values from wrists, shoulders, knees, lower_back.

The rationale should briefly explain the stage choice, including whether the
user should begin from basic movement or push-up progressions versus a later
progression stage.

Onboarding answers JSON: {json.dumps(answers)}
"""
    data = generate_json(prompt, ONBOARDING_ASSESSMENT_SCHEMA)

    if data is None:
        return None

    try:
        return OnboardingAssessment.model_validate(data)
    except ValidationError:
        return None


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
