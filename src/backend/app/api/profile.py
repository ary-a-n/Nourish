from fastapi import APIRouter, Depends, Header, HTTPException

from app.models.schemas import PatientProfile, SaveProfileRequest, SaveProfileResponse
from app.services.auth import get_db, get_user_from_token
from app.services.patient_profile_store import get_profile, save_profile


router = APIRouter(prefix="/v1/profile", tags=["profile"])


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization must be Bearer token")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token")
    return token


@router.put("", response_model=SaveProfileResponse)
def upsert_profile(
    payload: SaveProfileRequest,
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> SaveProfileResponse:
    token = _extract_bearer_token(authorization)
    try:
        user = get_user_from_token(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    profile_dict = payload.profile.model_dump()
    if not profile_dict.get("name"):
        profile_dict["name"] = user.get("name", "")
    save_profile(user["id"], profile_dict, db)
    return SaveProfileResponse(profile=PatientProfile(**profile_dict))


@router.get("", response_model=SaveProfileResponse)
def read_profile(
    authorization: str | None = Header(default=None),
    db=Depends(get_db),
) -> SaveProfileResponse:
    token = _extract_bearer_token(authorization)
    try:
        user = get_user_from_token(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    profile = get_profile(user["id"], db)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return SaveProfileResponse(profile=PatientProfile(**profile))
