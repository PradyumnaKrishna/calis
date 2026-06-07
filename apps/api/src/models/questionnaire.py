from datetime import UTC, datetime

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


class QuestionRecord(SQLModel, table=True):
    __tablename__ = "questions"
    __table_args__ = (UniqueConstraint("position", name="uq_questions_position"),)

    id: str = Field(primary_key=True)
    is_active: bool = Field(default=True, index=True)
    position: int
    weight: float = Field(default=1)
    type: str
    eyebrow: str
    question: str
    hint: str
    min_selections: int | None = None
    max_selections: int | None = None
    options: list["QuestionOptionRecord"] = Relationship(
        back_populates="question",
        sa_relationship_kwargs={"order_by": "QuestionOptionRecord.position"},
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class QuestionOptionRecord(SQLModel, table=True):
    __tablename__ = "question_options"
    __table_args__ = (
        UniqueConstraint(
            "question_id",
            "option_id",
            name="uq_question_options_question_option",
        ),
        UniqueConstraint(
            "question_id",
            "position",
            name="uq_question_options_question_position",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    question_id: str = Field(foreign_key="questions.id", ondelete="CASCADE", index=True)
    option_id: str = Field(index=True)
    position: int
    label: str
    score: int | None = None
    question: QuestionRecord | None = Relationship(back_populates="options")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
