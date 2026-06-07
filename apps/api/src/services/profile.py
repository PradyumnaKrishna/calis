from datetime import UTC, datetime
from uuid import uuid4

from sqlmodel import Session

from ..models import Profile, VolumeTier
from ..schemas import AnswerValue
from .level import assess_level
from .progression import next_level


def _single_answer(
    answers: dict[str, AnswerValue], key: str, default: str
) -> str:
    value = answers.get(key)

    if isinstance(value, str):
        return value

    if isinstance(value, list) and value:
        return value[0]

    return default


def _multi_answer(answers: dict[str, AnswerValue], key: str) -> list[str]:
    value = answers.get(key)

    if isinstance(value, list):
        return value

    if isinstance(value, str):
        return [value]

    return []


def _training_days(answer: str) -> int:
    match answer:
        case "days_1":
            return 1
        case "days_2":
            return 2
        case "days_4_plus":
            return 4
        case _:
            return 3


def create_profile(session: Session, answers: dict[str, AnswerValue]) -> Profile:
    assessment = assess_level(session, answers)
    goal = _single_answer(answers, "primary_goal", "general_fitness")
    training_days = _training_days(_single_answer(answers, "training_days", "days_3"))
    equipment = _multi_answer(answers, "equipment")
    constraints = [
        item for item in _multi_answer(answers, "constraints") if item != "none"
    ]
    now = datetime.now(UTC)

    profile = Profile(
        id=f"profile_{uuid4().hex}",
        goal=goal,
        level=assessment.level,
        training_days=training_days,
        equipment=equipment,
        constraints=constraints,
        answers=answers,
        current_plan_level=assessment.level,
        current_volume_tier=VolumeTier.LOW,
        created_at=now,
        updated_at=now,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)

    return profile


def advance_profile_plan(profile: Profile) -> None:
    match profile.current_volume_tier:
        case VolumeTier.LOW:
            profile.current_volume_tier = VolumeTier.MEDIUM
        case VolumeTier.MEDIUM:
            profile.current_volume_tier = VolumeTier.HIGH
        case VolumeTier.HIGH:
            profile.current_plan_level = next_level(profile.current_plan_level)
            profile.current_volume_tier = VolumeTier.LOW

    profile.updated_at = datetime.now(UTC)
