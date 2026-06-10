from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, Session, SQLModel, select

INITIAL_ONBOARDING_QUESTIONS = [
    {
        "id": "goal",
        "type": "text",
        "label": "What is your goal?",
        "hint": "Write the outcome you care about. Specific goals like pull-ups, handstands, strength, mobility, or general fitness help shape better follow-up questions.",
        "hintSummary": "Tell Calis the outcome you want most.",
        "hintDescription": "Write the outcome you care about. Specific goals like pull-ups, handstands, strength, mobility, or general fitness help shape better follow-up questions.",
        "required": True,
        "options": [],
    },
    {
        "id": "current_level",
        "type": "text",
        "label": "What is your current level?",
        "hint": "Describe what you can do today, recent training history, equipment, and anything that feels uncomfortable.",
        "hintSummary": "Share what you can do today so your first plan starts safely.",
        "hintDescription": "Describe what you can do today, recent training history, equipment, and anything that feels uncomfortable.",
        "required": True,
        "options": [],
    },
]


class OnboardingStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"


class OnboardingSession(SQLModel, table=True):
    __tablename__ = "onboarding_sessions"

    id: str = Field(primary_key=True)
    profile_id: str = Field(foreign_key="profiles.id", index=True)
    status: OnboardingStatus = Field(default=OnboardingStatus.ACTIVE, index=True)
    questions: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    answers: dict[str, str | list[str]] = Field(default_factory=dict, sa_column=Column(JSON))
    assessment: dict | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @classmethod
    def get_or_create_active(
        cls,
        session: Session,
        profile_id: str,
    ) -> "OnboardingSession":
        statement = (
            select(cls)
            .where(
                cls.profile_id == profile_id,
                cls.status == OnboardingStatus.ACTIVE,
            )
            .order_by(cls.created_at.desc())
        )
        onboarding_session = session.exec(statement).first()

        if onboarding_session is not None:
            return onboarding_session

        onboarding_session = cls(
            id=f"onboarding_{uuid4().hex}",
            profile_id=profile_id,
            questions=INITIAL_ONBOARDING_QUESTIONS,
        )
        session.add(onboarding_session)
        session.commit()
        session.refresh(onboarding_session)

        return onboarding_session
