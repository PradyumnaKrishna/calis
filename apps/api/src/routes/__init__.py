from fastapi import APIRouter

from .exercises import router as exercises_router
from .health import router as health_router
from .onboarding import router as onboarding_router
from .plans import router as plans_router
from .profile import router as profile_router


api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(exercises_router, prefix="/v1")
api_router.include_router(onboarding_router, prefix="/v1")
api_router.include_router(plans_router, prefix="/v1")
api_router.include_router(profile_router, prefix="/v1")
