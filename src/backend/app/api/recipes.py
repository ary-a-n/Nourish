from fastapi import APIRouter, Depends, Header, HTTPException

from app.models.schemas import (
    AiDashRecipeListResponse,
    AiDashRecipeRecord,
    AiDashRecipeRequest,
    AiDashRecipeResponse,
)
from app.services.ai_recipe import generate_dash_recipe, save_dash_recipe
from app.services.ai_recipe_store import get_dash_recipe_by_id, list_dash_recipes
from app.services.auth import get_db, get_user_from_token


router = APIRouter(prefix="/v1/recipes", tags=["recipes"])


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization must be Bearer token")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token")
    return token


@router.post("/dash/generate", response_model=AiDashRecipeResponse)
def generate_dash_recipe_for_user(
    payload: AiDashRecipeRequest,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> AiDashRecipeResponse:
    token = _extract_bearer_token(authorization)
    try:
        user = get_user_from_token(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    try:
        recipe, prompt_bundle = generate_dash_recipe(payload)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    record = save_dash_recipe(user["id"], payload, recipe, prompt_bundle, db)
    return AiDashRecipeResponse(
        recipe=recipe,
        created_at=record.created_at.isoformat(),
    )


@router.get("/dash", response_model=AiDashRecipeListResponse)
def list_dash_recipe_history(
    authorization: str | None = Header(default=None),
    limit: int = 20,
    offset: int = 0,
    db=Depends(get_db),
) -> AiDashRecipeListResponse:
    token = _extract_bearer_token(authorization)
    try:
        user = get_user_from_token(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    records = list_dash_recipes(user["id"], limit=limit, offset=offset, db=db)
    items = []
    for record in records:
        if record.result_json is None:
            continue
        items.append(
            AiDashRecipeRecord(
                id=record.id,
                recipe=record.result_json,
                created_at=record.created_at.isoformat(),
            )
        )
    return AiDashRecipeListResponse(total=len(items), items=items)


@router.get("/dash/{recipe_id}", response_model=AiDashRecipeRecord)
def get_dash_recipe_detail(
    recipe_id: str,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> AiDashRecipeRecord:
    token = _extract_bearer_token(authorization)
    try:
        user = get_user_from_token(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    record = get_dash_recipe_by_id(user["id"], recipe_id=recipe_id, db=db)
    if record is None or record.result_json is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return AiDashRecipeRecord(
        id=record.id,
        recipe=record.result_json,
        created_at=record.created_at.isoformat(),
    )
