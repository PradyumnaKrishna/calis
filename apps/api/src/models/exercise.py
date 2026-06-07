from datetime import UTC, datetime

from sqlalchemy import CheckConstraint
from sqlmodel import Field, SQLModel


class Exercise(SQLModel, table=True):
    __tablename__ = "exercises"
    __table_args__ = (
        CheckConstraint(
            "difficulty >= 1 AND difficulty <= 5",
            name="ck_exercises_difficulty_range",
        ),
    )

    id: str = Field(primary_key=True)
    slug: str = Field(index=True, unique=True)
    name: str = Field(index=True)
    body_region: str = Field(index=True)
    movement_pattern: str = Field(index=True)
    difficulty: int = Field(index=True, ge=1, le=5)
    level: str = Field(index=True)
    gif: str
    instructions: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
