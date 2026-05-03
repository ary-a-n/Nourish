from fastapi import APIRouter, Depends, Header, HTTPException

from app.models.schemas import AuthLoginRequest, AuthLoginResponse, AuthRegisterRequest, AuthRegisterResponse, AuthUser
from app.services.auth import get_db, get_user_from_token, login_user
from app.services.dietician_auth import register_dietician

router = APIRouter(prefix="/v1/dietician", tags=["dietician-auth"])


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization must be Bearer token")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token")
    return token


@router.post("/register", response_model=AuthRegisterResponse)
def register(payload: AuthRegisterRequest, db=Depends(get_db)) -> AuthRegisterResponse:
    try:
        user = register_dietician(payload.mobile, payload.password, payload.name, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AuthRegisterResponse(user=AuthUser(**user))


@router.post("/login", response_model=AuthLoginResponse)
def login(payload: AuthLoginRequest, db=Depends(get_db)) -> AuthLoginResponse:
    try:
        login_result = login_user(payload.mobile, payload.password, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    if login_result["user"]["role"] != "dietician":
        raise HTTPException(status_code=403, detail="Dietician access required")
    login_result["user"] = AuthUser(**login_result["user"])
    return AuthLoginResponse(**login_result)


@router.get("/me", response_model=AuthUser)
def auth_me(authorization: str | None = Header(default=None), db=Depends(get_db)) -> AuthUser:
    token = _extract_bearer_token(authorization)
    try:
        user = get_user_from_token(token, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    if user["role"] != "dietician":
        raise HTTPException(status_code=403, detail="Dietician access required")
    return AuthUser(**user)
