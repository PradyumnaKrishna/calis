from sqlalchemy import tuple_
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ..models import Level
from ..models import QuestionOptionRecord
from ..schemas import AnswerValue


def _level_from_score(score: float) -> Level:
    if score <= 2:
        return Level.FOUNDATION

    if score <= 5:
        return Level.BEGINNER

    if score <= 9:
        return Level.INTERMEDIATE

    return Level.ADVANCED


def _answer_option_ids(answer: AnswerValue) -> list[str]:
    return [answer] if isinstance(answer, str) else answer


def _selected_pairs(answers: dict[str, AnswerValue]) -> set[tuple[str, str]]:
    return {
        (question_id, option_id)
        for question_id, answer in answers.items()
        for option_id in _answer_option_ids(answer)
    }


def assess_level(session: Session, answers: dict[str, AnswerValue]) -> Level:
    selected_pairs = _selected_pairs(answers)

    if not selected_pairs:
        return Level.FOUNDATION

    options = session.exec(
        select(QuestionOptionRecord)
        .options(selectinload(QuestionOptionRecord.question))
        .where(
            tuple_(
                QuestionOptionRecord.question_id,
                QuestionOptionRecord.option_id,
            ).in_(selected_pairs)
        )
    ).all()
    score = sum(
        (option.score or 0) * (option.question.weight if option.question else 1)
        for option in options
    )

    return _level_from_score(score)
