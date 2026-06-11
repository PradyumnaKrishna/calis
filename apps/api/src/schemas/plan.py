from pydantic import ConfigDict
from sqlmodel import Field, SQLModel
from typing import Literal

from ..models import Level, VolumeTier

PlanFeedbackRating = Literal["too_hard", "manageable", "easy", "pain", "skipped"]
PlanAdjustmentAction = Literal[
    "keep_plan",
    "reduce_volume",
    "increase_volume",
    "repeat_level",
    "flag_pain",
]
PlanAdjustmentConfidence = Literal["low", "medium", "high"]


class PlanExercise(SQLModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    exercise_id: str = Field(alias="exerciseId")
    slug: str
    name: str
    movement_pattern: str = Field(alias="movementPattern")
    gif: str
    instructions: str
    sets: int
    reps: str | None = None
    hold_seconds: str | None = Field(default=None, alias="holdSeconds")
    rest_seconds: int = Field(alias="restSeconds")


class PlanWorkout(SQLModel):
    day: int
    title: str
    exercises: list[PlanExercise]


class PlanSummary(SQLModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    profile_id: str = Field(alias="profileId")
    level: Level
    plan_level: Level = Field(alias="planLevel")
    volume_tier: VolumeTier = Field(alias="volumeTier")


class CurrentPlan(PlanSummary):
    cycle_days: int = Field(alias="cycleDays")
    workouts: list[PlanWorkout]


class TodayPlan(PlanSummary):
    day: int
    completed: bool
    completed_exercise_ids: list[str] = Field(alias="completedExerciseIds")
    workout: PlanWorkout


class CompleteTodayExerciseRequest(SQLModel):
    model_config = ConfigDict(populate_by_name=True)

    exercise_id: str = Field(alias="exerciseId")


class PlanFeedbackRequest(SQLModel):
    rating: PlanFeedbackRating
    note: str | None = None


class PlanAdjustmentAssessment(SQLModel):
    action: PlanAdjustmentAction
    confidence: PlanAdjustmentConfidence
    rationale: str


class PlanFeedbackResponse(SQLModel):
    model_config = ConfigDict(populate_by_name=True)

    plan: TodayPlan
    assessment: PlanAdjustmentAssessment | None = None
