from datetime import UTC, date, datetime

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .level import Level
from .profile import VolumeTier


class PlanSnapshot(SQLModel, table=True):
    __tablename__ = "plan_snapshots"

    profile_id: str = Field(primary_key=True, foreign_key="profiles.id")
    plan_level: Level = Field(index=True)
    volume_tier: VolumeTier = Field(index=True)
    plan_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class PlanWorkoutCompletion(SQLModel, table=True):
    __tablename__ = "plan_workout_completions"

    profile_id: str = Field(primary_key=True, foreign_key="profiles.id")
    workout_date: date = Field(primary_key=True, index=True)
    day: int = Field(index=True)
    plan_level: Level | None = Field(default=None, index=True)
    volume_tier: VolumeTier | None = Field(default=None, index=True)
    feedback: str | None = Field(default=None, index=True)
    completed_exercise_ids: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSON),
    )
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
