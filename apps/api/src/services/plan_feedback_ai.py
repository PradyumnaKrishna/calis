import json

from pydantic import ValidationError

from ..core.config import GEMINI_API_KEY
from ..models import Profile
from ..schemas import (
    PlanAdjustmentAssessment,
    PlanFeedbackRating,
    PlanWorkout,
)
from .gemini import generate_json

PLAN_ADJUSTMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": [
                "keep_plan",
                "reduce_volume",
                "increase_volume",
                "repeat_level",
                "flag_pain",
            ],
        },
        "confidence": {
            "type": "string",
            "enum": ["low", "medium", "high"],
        },
        "rationale": {"type": "string"},
    },
    "required": ["action", "confidence", "rationale"],
}


def assess_plan_feedback(
    *,
    profile: Profile,
    workout: PlanWorkout,
    rating: PlanFeedbackRating,
    note: str | None,
) -> PlanAdjustmentAssessment | None:
    if not GEMINI_API_KEY:
        return None

    data = generate_json(
        _build_prompt(profile=profile, workout=workout, rating=rating, note=note),
        PLAN_ADJUSTMENT_SCHEMA,
    )

    if data is None:
        return None

    try:
        return PlanAdjustmentAssessment.model_validate(data)
    except ValidationError:
        return None


def _build_prompt(
    *,
    profile: Profile,
    workout: PlanWorkout,
    rating: PlanFeedbackRating,
    note: str | None,
) -> str:
    profile_context = {
        "level": profile.level,
        "currentPlanLevel": profile.current_plan_level,
        "currentVolumeTier": profile.current_volume_tier,
        "goal": profile.goal,
        "trainingDays": profile.training_days,
        "equipment": profile.equipment,
        "constraints": profile.constraints,
    }
    workout_context = workout.model_dump(mode="json", by_alias=True)
    feedback_context = {"rating": rating, "note": note}

    return f"""
You are Calis, a conservative calisthenics plan reviewer.

Classify the user's workout feedback into exactly one small plan adjustment.
Do not generate exercises or a new workout.

Allowed actions:
- keep_plan: feedback does not require a plan change.
- reduce_volume: the current plan is too hard or the user could not finish.
- increase_volume: the user reports the plan is easy and has no pain signal.
- repeat_level: the user should stay on the current level instead of advancing.
- flag_pain: the user reports pain or discomfort that should block advancement.

Rules:
- Pain or discomfort must be flag_pain.
- If confidence is low, prefer keep_plan unless pain is present.
- Do not recommend increase_volume when pain, skipped work, or "too hard" is present.
- Keep the rationale to one short sentence.

Profile JSON: {json.dumps(profile_context)}
Workout JSON: {json.dumps(workout_context)}
Feedback JSON: {json.dumps(feedback_context)}
"""
