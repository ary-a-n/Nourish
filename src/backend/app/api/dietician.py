from fastapi import APIRouter, Depends, Header, HTTPException

from app.models.schemas import (
    AiDashRecipeListResponse,
    AiDashRecipeRecord,
    DieticianAiKitchenRequest,
    DieticianAssignmentResponse,
    DieticianPatientListResponse,
    DieticianPlanResponse,
    DieticianPlanUpdateRequest,
    PatientProfile,
)
from app.services.auth import get_db
from app.services.clinical_math import calculate_dash_tdee_and_constraints
from app.services.dietician_store import (
    assign_patient,
    unassign_patient,
    create_plan,
    get_plan_with_items,
    list_patients,
    mark_prior_plans_replaced,
    replace_plan_items,
    touch_plan,
    update_plan_status,
)
from app.services.ai_recipe_store import list_dash_recipes as list_patient_dash_recipes
from app.services.data_loader import load_recipes
from app.services.patient_profile_store import get_profile
from app.services.permissions import get_dietician_user
from app.services.recommendation import generate_personalized_exchange_plan, rank_meals
from data.models import DieticianPlan, DieticianPlanItem

router = APIRouter(prefix="/v1/dietician", tags=["dietician"])


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


def _build_base_plan(profile: PatientProfile) -> list[dict]:
    recipes = load_recipes()
    ranked_df = rank_meals(recipes)
    if ranked_df.empty:
        raise HTTPException(status_code=404, detail="No meals available after safety filters")
    constraints = _calculate_constraints_from_profile(profile)
    plan_df = generate_personalized_exchange_plan(
        ranked_df=ranked_df,
        constraints=constraints,
        patient_diet_pref=profile.diet_pref,
        options_per_slot=3,
        top_n_pool=15,
        random_seed=None,
    )
    items = []
    for _, row in plan_df.iterrows():
        items.append(
            {
                "meal_slot": str(row.get("Meal_Slot", "")),
                "source_type": "dataset",
                "payload_json": row.to_dict(),
            }
        )
    return items


def _plan_to_response(plan, items) -> DieticianPlanResponse:
    item_payloads = [
        {
            "id": item.id,
            "meal_slot": item.meal_slot,
            "source_type": item.source_type,
            "payload_json": item.payload_json,
        }
        for item in items
    ]
    return DieticianPlanResponse(
        plan={
            "id": plan.id,
            "patient_id": plan.patient_id,
            "created_by": plan.created_by,
            "status": plan.status,
            "approved_by": plan.approved_by,
            "created_at": plan.created_at.isoformat(),
            "updated_at": plan.updated_at.isoformat(),
            "items": item_payloads,
        }
    )


@router.get("/patients", response_model=DieticianPatientListResponse)
def list_dietician_patients(
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> DieticianPatientListResponse:
    token = _extract_bearer_token(authorization)
    try:
        dietician = get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    patients = list_patients(db=db, dietician_id=dietician["id"])
    return DieticianPatientListResponse(total=len(patients), patients=patients)


@router.get("/patients/{patient_id}/profile", response_model=PatientProfile)
def get_patient_profile(
    patient_id: str,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> PatientProfile:
    token = _extract_bearer_token(authorization)
    try:
        get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    profile = get_profile(patient_id, db)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return PatientProfile(**profile)


@router.put("/patients/{patient_id}/profile", response_model=PatientProfile)
def update_patient_profile(
    patient_id: str,
    payload: PatientProfile,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> PatientProfile:
    token = _extract_bearer_token(authorization)
    try:
        get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    from app.services.patient_profile_store import save_profile
    profile_dict = payload.model_dump()
    save_profile(patient_id, profile_dict, db)
    return PatientProfile(**profile_dict)


@router.post("/patients/{patient_id}/assign", response_model=DieticianAssignmentResponse)
def assign_patient_to_self(
    patient_id: str,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> DieticianAssignmentResponse:
    token = _extract_bearer_token(authorization)
    try:
        dietician = get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    assignment = assign_patient(db=db, dietician_id=dietician["id"], patient_id=patient_id)
    return DieticianAssignmentResponse(**assignment)


@router.delete("/patients/{patient_id}/assign", status_code=204)
def unassign_patient_from_self(
    patient_id: str,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> None:
    token = _extract_bearer_token(authorization)
    try:
        dietician = get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    unassign_patient(db=db, dietician_id=dietician["id"], patient_id=patient_id)


@router.get("/patients/{patient_id}/recipes", response_model=AiDashRecipeListResponse)
def get_patient_recipe_history(
    patient_id: str,
    authorization: str | None = Header(default=None),
    limit: int = 20,
    offset: int = 0,
    db=Depends(get_db),
) -> AiDashRecipeListResponse:
    token = _extract_bearer_token(authorization)
    try:
        get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    records = list_patient_dash_recipes(patient_id, limit=limit, offset=offset, db=db)
    items = [
        AiDashRecipeRecord(
            id=r.id,
            recipe=r.result_json,
            created_at=r.created_at.isoformat(),
        )
        for r in records
        if r.result_json is not None
    ]
    return AiDashRecipeListResponse(total=len(items), items=items)


@router.get("/patients/{patient_id}/plan", response_model=DieticianPlanResponse)
def get_patient_plan(
    patient_id: str,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> DieticianPlanResponse:
    token = _extract_bearer_token(authorization)
    try:
        get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    
    plan = db.query(DieticianPlan).filter(DieticianPlan.patient_id == patient_id).order_by(DieticianPlan.created_at.desc()).first()
    if plan is None:
        raise HTTPException(status_code=404, detail="No plan found for this patient")
    items = db.query(DieticianPlanItem).filter(DieticianPlanItem.plan_id == plan.id).all()
    return _plan_to_response(plan, items)


@router.post("/patients/{patient_id}/plan", response_model=DieticianPlanResponse)
def generate_patient_plan(
    patient_id: str,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> DieticianPlanResponse:
    token = _extract_bearer_token(authorization)
    try:
        dietician = get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    profile = get_profile(patient_id, db)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    plan = create_plan(db=db, patient_id=patient_id, created_by=dietician["id"])
    items = _build_base_plan(PatientProfile(**profile))
    created_items = replace_plan_items(db=db, plan_id=plan.id, items=items)
    plan = touch_plan(db=db, plan=plan)
    return _plan_to_response(plan, created_items)


@router.patch("/plans/{plan_id}", response_model=DieticianPlanResponse)
def update_plan(
    plan_id: str,
    payload: DieticianPlanUpdateRequest,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> DieticianPlanResponse:
    token = _extract_bearer_token(authorization)
    try:
        dietician = get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    plan_bundle = get_plan_with_items(db=db, plan_id=plan_id)
    if plan_bundle is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan, items = plan_bundle

    if payload.items is not None:
        item_dicts = [item.model_dump() for item in payload.items]
        items = replace_plan_items(db=db, plan_id=plan_id, items=item_dicts)
        plan = touch_plan(db=db, plan=plan)

    if payload.status is not None:
        plan = update_plan_status(db=db, plan=plan, status=payload.status, actor_id=dietician["id"])
        if payload.status == "approved":
            mark_prior_plans_replaced(db=db, patient_id=plan.patient_id, approved_plan_id=plan.id)

    return _plan_to_response(plan, items)


@router.post("/plans/{plan_id}/ai-kitchen", response_model=DieticianPlanResponse)
def attach_ai_kitchen_recipe(
    plan_id: str,
    payload: DieticianAiKitchenRequest,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> DieticianPlanResponse:
    token = _extract_bearer_token(authorization)
    try:
        get_dietician_user(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    plan_bundle = get_plan_with_items(db=db, plan_id=plan_id)
    if plan_bundle is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan, items = plan_bundle
    items_payload = [
        {
            "meal_slot": item.meal_slot,
            "source_type": item.source_type,
            "payload_json": item.payload_json,
        }
        for item in items
        if item.meal_slot != payload.meal_slot
    ]
    items_payload.append(
        {
            "meal_slot": payload.meal_slot,
            "source_type": "ai",
            "payload_json": payload.recipe.model_dump(),
        }
    )
    updated_items = replace_plan_items(db=db, plan_id=plan_id, items=items_payload)
    plan = touch_plan(db=db, plan=plan)
    return _plan_to_response(plan, updated_items)
