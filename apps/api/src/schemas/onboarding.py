from typing import Literal

from pydantic import ConfigDict, Field
from sqlmodel import SQLModel

from ..models import Level
from .level import AnswerValue
from .profile import ProfilePublic


class OnboardingOption(SQLModel):
    id: str
    label: str


class OnboardingQuestion(SQLModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: Literal["text", "select", "multi_select"]
    label: str
    hint: str | None = None
    hint_summary: str = Field(alias="hintSummary")
    hint_description: str = Field(alias="hintDescription")
    required: bool = True
    options: list[OnboardingOption] = Field(default_factory=list)


class OnboardingRequest(SQLModel):
    answers: dict[str, AnswerValue]


class OnboardingAssessment(SQLModel):
    model_config = ConfigDict(populate_by_name=True)

    level: Level
    goal: str
    training_days: int = Field(alias="trainingDays", ge=1, le=4)
    equipment: list[str]
    constraints: list[str]
    rationale: str


class OnboardingResponse(SQLModel):
    status: Literal["in_progress", "completed"]
    questions: list[OnboardingQuestion] = Field(default_factory=list)
    profile: ProfilePublic | None = None
