from sqlalchemy.orm import Session

from app.services.auth import create_user


def register_dietician(mobile: str, password: str, name: str, db: Session | None = None) -> dict:
    return create_user(mobile, password, name, role="dietician", db=db)
