from fastapi import APIRouter, Depends, Header, HTTPException

from app.models.schemas import ConstraintsResponse, MealOption, PatientProfile, PlanResponse
from app.services.auth import get_db, get_user_from_token
from app.services.clinical_math import calculate_dash_tdee_and_constraints
from app.services.data_loader import load_recipes
from app.services.patient_profile_store import get_profile
from app.services.recommendation import generate_personalized_exchange_plan, rank_meals


router = APIRouter(prefix="/v1/plan", tags=["plan"])


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization must be Bearer token")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token")
    return token


def _calculate_constraints_from_profile(profile: PatientProfile) -> dict:
    return calculate_dash_tdee_and_constraints(
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        age_years=profile.age_years,
        gender=profile.gender,
        activity_level=profile.activity_level,
        bp_stage=profile.bp_stage,
    )


def _build_plan(
    profile: PatientProfile,
    options_per_slot: int,
    top_n_pool: int,
    random_seed: int | None,
) -> PlanResponse:
    recipes = load_recipes()
    ranked_df = rank_meals(recipes)
    if ranked_df.empty:
        raise HTTPException(status_code=404, detail="No meals available after safety filters")

    constraints = _calculate_constraints_from_profile(profile)
    plan_df = generate_personalized_exchange_plan(
        ranked_df=ranked_df,
        constraints=constraints,
        patient_diet_pref=profile.diet_pref,
        options_per_slot=options_per_slot,
        top_n_pool=top_n_pool,
        random_seed=random_seed,
    )

    plan_meals = [_to_meal_option(row) for _, row in plan_df.iterrows()] if not plan_df.empty else []
    return PlanResponse(
        constraints=ConstraintsResponse(**constraints),
        total_options=len(plan_meals),
        plan=plan_meals,
    )


def _to_meal_option(row, meal_slot: str | None = None) -> MealOption:
    slot = meal_slot if meal_slot is not None else row.get("Meal_Slot", "Ranked")
    return MealOption(
        meal_slot=str(slot),
        course_type=str(row.get("Course_Type", "")),
        diet_type=str(row.get("Diet_Type", "")),
        food_name=str(row.get("food_name", "")),
        dash_score=float(row.get("DASH_Score", 0.0)),
        unit_serving_energy_kcal=float(row.get("unit_serving_energy_kcal", 0.0)),
        unit_serving_sodium_mg=float(row.get("unit_serving_sodium_mg", 0.0)),
        unit_serving_potassium_mg=float(row.get("unit_serving_potassium_mg", 0.0)),
        unit_serving_fibre_g=float(row.get("unit_serving_fibre_g", 0.0)),
        unit_serving_sfa_mg=float(row.get("unit_serving_sfa_mg", 0.0)),
    )


@router.post("/generate/me", response_model=PlanResponse)
def generate_plan_for_me(
    authorization: str | None = Header(default=None),
    options_per_slot: int = 3,
    top_n_pool: int = 15,
    random_seed: int | None = None,
    db=Depends(get_db),
) -> PlanResponse:
    token = _extract_bearer_token(authorization)
    try:
        user = get_user_from_token(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    profile = get_profile(user["id"], db)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return _build_plan(
        profile=PatientProfile(**profile),
        options_per_slot=options_per_slot,
        top_n_pool=top_n_pool,
        random_seed=random_seed,
    )
