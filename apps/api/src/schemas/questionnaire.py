from typing import Literal

from pydantic import ConfigDict, Field
from sqlmodel import SQLModel


class QuestionnaireOption(SQLModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    option_id: str = Field(serialization_alias="id")
    label: str
    score: int | None = None


class QuestionnaireStep(SQLModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    type: Literal["single", "multi"]
    weight: float
    eyebrow: str
    question: str
    hint: str
    min_selections: int | None = Field(
        default=None, serialization_alias="minSelections"
    )
    max_selections: int | None = Field(
        default=None, serialization_alias="maxSelections"
    )
    options: list[QuestionnaireOption]


class Questionnaire(SQLModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    description: str
    steps: list[QuestionnaireStep]
