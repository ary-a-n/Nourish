from sqlalchemy.orm import Session

from data.models import PatientProfile


def save_profile(user_id: str, profile: dict, db: Session) -> dict:
    existing_profile = db.query(PatientProfile).filter(PatientProfile.id == user_id).first()
    if existing_profile:
        for key, value in profile.items():
            if hasattr(existing_profile, key):
                setattr(existing_profile, key, value)
    else:
        db.add(PatientProfile(id=user_id, **profile))
    db.commit()
    return profile


def get_profile(user_id: str, db: Session) -> dict | None:
    profile = db.query(PatientProfile).filter(PatientProfile.id == user_id).first()
    if profile is None:
        return None
    return {
        "name": profile.name,
        "weight_kg": profile.weight_kg,
        "height_cm": profile.height_cm,
        "age_years": profile.age_years,
        "gender": profile.gender,
        "activity_level": profile.activity_level,
        "bp_stage": profile.bp_stage,
        "diet_pref": profile.diet_pref,
    }
