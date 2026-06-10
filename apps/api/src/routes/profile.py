from fastapi import APIRouter, Depends, Request
from sqlmodel import Session

from ..core.database import get_session
from ..models import Profile
from ..schemas import ProfilePublic
from ..services.plan import get_current_plan
from ..services.profile import create_default_profile
from ..services.streak import reconcile_streak_for_current_plan

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfilePublic)
def profile(
    request: Request,
    session: Session = Depends(get_session),
) -> ProfilePublic:
    profile_id = getattr(request.state, "profile_id", None)

    profile = session.get(Profile, profile_id)
    if profile is None:
        profile = create_default_profile(session)

    if profile.onboarded:
        plan = get_current_plan(session, profile)

        if reconcile_streak_for_current_plan(session, profile, plan):
            session.commit()
            session.refresh(profile)

    return ProfilePublic(
        profile_id=profile.id,
        level=profile.level,
        current_plan_level=profile.current_plan_level,
        current_volume_tier=profile.current_volume_tier,
        onboarded=profile.onboarded,
        streak=profile.streak,
    )
