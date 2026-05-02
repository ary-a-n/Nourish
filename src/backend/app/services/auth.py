import hashlib
import secrets
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from data.db import SessionLocal, User, Session as DBSession

SESSION_TTL_DAYS = 30

# Database session utility functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def _db_context(db: Session | None):
    if db is None:
        with SessionLocal() as session:
            yield session
    else:
        yield db

def normalize_mobile(mobile: str) -> str:
    value = mobile.strip().replace(" ", "")
    if not value.startswith("+91"):
        raise ValueError("Mobile number must start with +91")
    rest = value[3:]
    if len(rest) != 10 or not rest.isdigit():
        raise ValueError("Mobile number must be +91 followed by 10 digits")
    return f"+91{rest}"

def _hash_password(password: str) -> str:
    digest = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return digest

def create_user(mobile: str, password: str, name: str, db: Session | None = None) -> dict:
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")

    phone = normalize_mobile(mobile)
    with _db_context(db) as session:
        existing_user = session.query(User).filter(User.mobile == phone).first()
        if existing_user:
            raise ValueError("User already exists")

        user = User(
            id=secrets.token_hex(8),
            mobile=phone,
            password_hash=_hash_password(password),
            name=name.strip(),
            created_at=datetime.now(timezone.utc),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"id": user.id, "mobile": user.mobile, "name": user.name}

def login_user(mobile: str, password: str, db: Session | None = None) -> dict:
    phone = normalize_mobile(mobile)
    with _db_context(db) as session:
        user = session.query(User).filter(User.mobile == phone).first()
        if user is None or user.password_hash != _hash_password(password):
            raise ValueError("Invalid mobile number or password")

        # Invalidate existing sessions for this user to prevent accumulation
        session.query(DBSession).filter(DBSession.user_id == user.id).delete()

        now = datetime.now(timezone.utc)
        db_session = DBSession(
            token=secrets.token_urlsafe(32),
            user_id=user.id,
            created_at=now,
            expires_at=(now + timedelta(days=SESSION_TTL_DAYS)),
        )
        session.add(db_session)
        session.commit()
        session.refresh(db_session)
        return {
            "access_token": db_session.token,
            "token_type": "bearer",
            "expires_at": db_session.expires_at.isoformat(),
            "user": {"id": user.id, "mobile": user.mobile, "name": user.name},
        }

def logout_user(token: str, db: Session | None = None):
    with _db_context(db) as session:
        session.query(DBSession).filter(DBSession.token == token).delete()
        session.commit()

def get_user_from_token(token: str, db: Session | None = None) -> dict:
    with _db_context(db) as session:
        db_session = session.query(DBSession).filter(DBSession.token == token).first()
        if db_session is None:
            raise ValueError("Invalid or expired token")

        now = datetime.now(timezone.utc)
        expires_at = db_session.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        else:
            expires_at = expires_at.astimezone(timezone.utc)

        if expires_at <= now:
            session.delete(db_session)
            session.commit()
            raise ValueError("Invalid or expired token")

        user = session.query(User).filter(User.id == db_session.user_id).first()
        if user is None:
            raise ValueError("User not found for token")

        return {"id": user.id, "mobile": user.mobile, "name": user.name}
