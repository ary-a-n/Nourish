import secrets
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from data.models import DieticianAssignment, DieticianPlan, DieticianPlanItem, User


def list_patients(db: Session, dietician_id: str) -> list[dict]:
    patients = db.query(User).filter(User.role == "patient").order_by(User.created_at.desc()).all()
    assigned_ids = {
        row.patient_id
        for row in db.query(DieticianAssignment.patient_id)
        .filter(DieticianAssignment.dietician_id == dietician_id)
        .all()
    }
    return [
        {
            "id": patient.id,
            "name": patient.name,
            "mobile": patient.mobile,
            "assigned": patient.id in assigned_ids,
        }
        for patient in patients
    ]


def assign_patient(db: Session, dietician_id: str, patient_id: str) -> dict:
    existing = (
        db.query(DieticianAssignment)
        .filter(
            DieticianAssignment.dietician_id == dietician_id,
            DieticianAssignment.patient_id == patient_id,
        )
        .first()
    )
    if existing:
        return {
            "patient_id": existing.patient_id,
            "dietician_id": existing.dietician_id,
            "created_at": existing.created_at.isoformat(),
        }

    now = datetime.now(timezone.utc)
    assignment = DieticianAssignment(
        id=secrets.token_hex(8),
        dietician_id=dietician_id,
        patient_id=patient_id,
        created_at=now,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {
        "patient_id": assignment.patient_id,
        "dietician_id": assignment.dietician_id,
        "created_at": assignment.created_at.isoformat(),
    }


def unassign_patient(db: Session, dietician_id: str, patient_id: str) -> bool:
    """Remove the assignment between a dietician and a patient. Returns True if deleted."""
    deleted = (
        db.query(DieticianAssignment)
        .filter(
            DieticianAssignment.dietician_id == dietician_id,
            DieticianAssignment.patient_id == patient_id,
        )
        .delete()
    )
    db.commit()
    return deleted > 0


def create_plan(db: Session, patient_id: str, created_by: str) -> DieticianPlan:
    now = datetime.now(timezone.utc)
    plan = DieticianPlan(
        id=secrets.token_hex(8),
        patient_id=patient_id,
        created_by=created_by,
        status="draft",
        approved_by=None,
        created_at=now,
        updated_at=now,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def replace_plan_items(db: Session, plan_id: str, items: list[dict]) -> list[DieticianPlanItem]:
    db.query(DieticianPlanItem).filter(DieticianPlanItem.plan_id == plan_id).delete()
    now = datetime.now(timezone.utc)
    records = []
    for item in items:
        record = DieticianPlanItem(
            id=secrets.token_hex(8),
            plan_id=plan_id,
            meal_slot=item["meal_slot"],
            source_type=item["source_type"],
            payload_json=item["payload_json"],
            created_at=now,
        )
        db.add(record)
        records.append(record)
    db.commit()
    return records


def get_plan_with_items(db: Session, plan_id: str) -> tuple[DieticianPlan, list[DieticianPlanItem]] | None:
    plan = db.query(DieticianPlan).filter(DieticianPlan.id == plan_id).first()
    if plan is None:
        return None
    items = (
        db.query(DieticianPlanItem)
        .filter(DieticianPlanItem.plan_id == plan_id)
        .order_by(DieticianPlanItem.created_at.asc())
        .all()
    )
    return plan, items


def update_plan_status(db: Session, plan: DieticianPlan, status: str, actor_id: str) -> DieticianPlan:
    now = datetime.now(timezone.utc)
    plan.status = status
    plan.updated_at = now
    if status == "approved":
        plan.approved_by = actor_id
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def touch_plan(db: Session, plan: DieticianPlan) -> DieticianPlan:
    plan.updated_at = datetime.now(timezone.utc)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def mark_prior_plans_replaced(db: Session, patient_id: str, approved_plan_id: str) -> None:
    db.query(DieticianPlan).filter(
        DieticianPlan.patient_id == patient_id,
        DieticianPlan.status == "approved",
        DieticianPlan.id != approved_plan_id,
    ).update({DieticianPlan.status: "superseded"})
    db.commit()


def get_latest_approved_plan(db: Session, patient_id: str) -> tuple[DieticianPlan, list[DieticianPlanItem]] | None:
    plan = (
        db.query(DieticianPlan)
        .filter(DieticianPlan.patient_id == patient_id, DieticianPlan.status == "approved")
        .order_by(DieticianPlan.updated_at.desc())
        .first()
    )
    if plan is None:
        return None
    items = (
        db.query(DieticianPlanItem)
        .filter(DieticianPlanItem.plan_id == plan.id)
        .order_by(DieticianPlanItem.created_at.asc())
        .all()
    )
    return plan, items
