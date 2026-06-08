from pydantic import ConfigDict
from sqlmodel import Field, SQLModel

from ..models import Level, VolumeTier


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


class CurrentPlan(SQLModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    profile_id: str = Field(alias="profileId")
    level: Level
    plan_level: Level = Field(alias="planLevel")
    volume_tier: VolumeTier = Field(alias="volumeTier")
    cycle_days: int = Field(alias="cycleDays")
    workouts: list[PlanWorkout]


class TodayPlan(SQLModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    profile_id: str = Field(alias="profileId")
    level: Level
    plan_level: Level = Field(alias="planLevel")
    volume_tier: VolumeTier = Field(alias="volumeTier")
    day: int
    completed: bool
    completed_exercise_ids: list[str] = Field(alias="completedExerciseIds")
    workout: PlanWorkout


class CompleteTodayExerciseRequest(SQLModel):
    model_config = ConfigDict(populate_by_name=True)

    exercise_id: str = Field(alias="exerciseId")
