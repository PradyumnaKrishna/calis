from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session

from ..core.database import get_session
from ..models import Profile
from ..schemas import ProfilePublic
from ..services.plan import get_current_plan
from ..services.streak import reconcile_streak_for_current_plan

router = APIRouter(prefix="/profile", tags=["profile"])


def get_profile(
    profile_id: str = Header(alias="X-Profile-Id"),
    session: Session = Depends(get_session),
) -> Profile:
    profile = session.get(Profile, profile_id)

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.get("", response_model=ProfilePublic)
def profile(
    profile: Profile = Depends(get_profile),
    session: Session = Depends(get_session),
) -> ProfilePublic:
    plan = get_current_plan(session, profile)

    if reconcile_streak_for_current_plan(session, profile, plan):
        session.commit()
        session.refresh(profile)

    return ProfilePublic(
        profile_id=profile.id,
        level=profile.level,
        current_plan_level=profile.current_plan_level,
        current_volume_tier=profile.current_volume_tier,
        streak=profile.streak,
    )
