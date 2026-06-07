from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session

from ..core.database import get_session
from ..models import Profile
from ..schemas import CurrentPlan, PlanProgressRequest, PlanProgressResponse
from ..services.plan import generate_current_plan
from ..services.profile import advance_profile_plan


router = APIRouter(prefix="/plans", tags=["plans"])


def get_profile(
    profile_id: str = Header(alias="X-Profile-Id"),
    session: Session = Depends(get_session),
) -> Profile:
    profile = session.get(Profile, profile_id)

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.get("/current", response_model=CurrentPlan)
def current_plan(
    profile: Profile = Depends(get_profile),
    session: Session = Depends(get_session),
) -> CurrentPlan:
    return generate_current_plan(session, profile)


@router.post("/current/progress", response_model=PlanProgressResponse)
def progress_current_plan(
    request: PlanProgressRequest,
    profile: Profile = Depends(get_profile),
    session: Session = Depends(get_session),
) -> PlanProgressResponse:
    if request.result in {"completed", "too_easy"}:
        advance_profile_plan(profile)
        session.add(profile)
        session.commit()
        session.refresh(profile)

    return PlanProgressResponse(
        profile_id=profile.id,
        plan_level=profile.current_plan_level,
        volume_tier=profile.current_volume_tier,
    )
