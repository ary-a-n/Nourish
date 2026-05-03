from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    mobile = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="patient")
    created_at = Column(DateTime(timezone=True), nullable=False)


class Session(Base):
    __tablename__ = "sessions"

    token = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    age_years = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    activity_level = Column(String, nullable=False)
    bp_stage = Column(String, nullable=False)
    diet_pref = Column(String, nullable=False)


class AiDashRecipe(Base):
    __tablename__ = "ai_dash_recipes"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    meal_type = Column(String, nullable=False)
    diet_pref = Column(String, nullable=False)
    request_json = Column(JSON, nullable=False)
    result_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)


class DieticianAssignment(Base):
    __tablename__ = "dietician_assignments"

    id = Column(String, primary_key=True, index=True)
    dietician_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    patient_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False)


class DieticianPlan(Base):
    __tablename__ = "dietician_plans"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, nullable=False, index=True)
    approved_by = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)


class DieticianPlanItem(Base):
    __tablename__ = "dietician_plan_items"

    id = Column(String, primary_key=True, index=True)
    plan_id = Column(String, ForeignKey("dietician_plans.id"), nullable=False, index=True)
    meal_slot = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    payload_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String, nullable=False)
    target_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
