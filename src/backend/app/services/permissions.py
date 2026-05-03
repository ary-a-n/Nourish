from sqlalchemy.orm import Session

from app.services.auth import get_user_from_token


def get_dietician_user(token: str, db: Session) -> dict:
    user = get_user_from_token(token, db=db)
    if user["role"] != "dietician":
        raise ValueError("Dietician access required")
    return user


def get_patient_user(token: str, db: Session) -> dict:
    user = get_user_from_token(token, db=db)
    if user["role"] != "patient":
        raise ValueError("Patient access required")
    return user


def get_patient_or_dietician_user(token: str, db: Session) -> dict:
    """Allow both patients and dieticians to access an endpoint."""
    user = get_user_from_token(token, db=db)
    if user["role"] not in ("patient", "dietician"):
        raise ValueError("Patient or dietician access required")
    return user
