from datetime import UTC, datetime
from uuid import uuid4

from sqlmodel import Session

from ..models import Profile, VolumeTier
from ..schemas import OnboardingAssessment
from .progression import next_level


def create_default_profile(session: Session) -> Profile:
    now = datetime.now(UTC)
    profile = Profile(
        id=f"profile_{uuid4().hex}",
        created_at=now,
        updated_at=now,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)

    return profile


def apply_onboarding_assessment(
    profile: Profile,
    assessment: OnboardingAssessment,
) -> None:
    now = datetime.now(UTC)

    profile.goal = assessment.goal
    profile.level = assessment.level
    profile.training_days = assessment.training_days
    profile.equipment = assessment.equipment
    profile.constraints = assessment.constraints
    profile.current_plan_level = assessment.level
    profile.current_volume_tier = VolumeTier.LOW
    profile.current_plan_started_at = now
    profile.onboarded = True
    profile.updated_at = now


def advance_profile_plan(profile: Profile) -> None:
    match profile.current_volume_tier:
        case VolumeTier.LOW:
            profile.current_volume_tier = VolumeTier.MEDIUM
        case VolumeTier.MEDIUM:
            profile.current_volume_tier = VolumeTier.HIGH
        case VolumeTier.HIGH:
            profile.current_plan_level = next_level(profile.current_plan_level)
            profile.current_volume_tier = VolumeTier.LOW

    now = datetime.now(UTC)
    profile.current_plan_started_at = now
    profile.updated_at = now
