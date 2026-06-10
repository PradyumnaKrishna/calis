from fastapi import Depends, HTTPException, Request
from sqlmodel import Session

from ..core.database import get_session
from ..models import Profile


def get_profile(
    request: Request,
    session: Session = Depends(get_session),
) -> Profile:
    profile_id = getattr(request.state, "profile_id", None)

    if not profile_id:
        raise HTTPException(status_code=401, detail="Missing profile id")

    profile = session.get(Profile, profile_id)

    if profile is None:
        raise HTTPException(status_code=401, detail="Profile not found")

    return profile


def get_onboarded_profile(
    profile: Profile = Depends(get_profile),
) -> Profile:
    if not profile.onboarded:
        raise HTTPException(status_code=401, detail="Onboarding required")

    return profile
