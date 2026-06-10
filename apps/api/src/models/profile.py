from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .level import Level


class VolumeTier(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: str = Field(primary_key=True)
    goal: str = Field(default="general_fitness", index=True)
    level: Level = Field(default=Level.FOUNDATION, index=True)
    training_days: int = Field(default=3, index=True)
    equipment: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    constraints: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    current_plan_level: Level = Field(default=Level.FOUNDATION, index=True)
    current_volume_tier: VolumeTier = Field(default=VolumeTier.LOW, index=True)
    current_plan_started_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    onboarded: bool = Field(default=False, index=True)
    streak: int = Field(default=0, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
