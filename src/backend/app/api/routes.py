from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.meals import router as meals_router
from app.api.plans import router as plans_router
from app.api.profile import router as profile_router
from app.api.recipes import router as recipes_router


router = APIRouter()
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(profile_router)
router.include_router(meals_router)
router.include_router(plans_router)
router.include_router(recipes_router)
