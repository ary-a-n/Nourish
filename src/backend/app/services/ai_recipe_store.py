from sqlalchemy.orm import Session

from data.db import AiDashRecipe as AiDashRecipeModel


def list_dash_recipes(user_id: str, limit: int, offset: int, db: Session) -> list[AiDashRecipeModel]:
    return (
        db.query(AiDashRecipeModel)
        .filter(AiDashRecipeModel.user_id == user_id)
        .order_by(AiDashRecipeModel.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_dash_recipe_by_id(user_id: str, recipe_id: str, db: Session) -> AiDashRecipeModel | None:
    return (
        db.query(AiDashRecipeModel)
        .filter(AiDashRecipeModel.user_id == user_id, AiDashRecipeModel.id == recipe_id)
        .first()
    )
