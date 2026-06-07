from sqlmodel import SQLModel

from ..models import Level

AnswerValue = str | list[str]


class LevelRequest(SQLModel):
    answers: dict[str, AnswerValue]


class LevelAssessment(SQLModel):
    level: Level
