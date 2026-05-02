from fastapi import APIRouter

from app.models.schemas import MealOption, RankMealsRequest, RankedMealsResponse
from app.services.data_loader import load_recipes
from app.services.recommendation import rank_meals


router = APIRouter(prefix="/v1/meals", tags=["meals"])


def _to_meal_option(row, meal_slot: str | None = None) -> MealOption:
    slot = meal_slot if meal_slot is not None else row.get("Meal_Slot", "Ranked")
    return MealOption(
        meal_slot=str(slot),
        course_type=str(row.get("Course_Type", "")),
        diet_type=str(row.get("Diet_Type", "")),
        food_name=str(row.get("food_name", "")),
        dash_score=float(row.get("DASH_Score", 0.0)),
        unit_serving_energy_kcal=float(row.get("unit_serving_energy_kcal", 0.0)),
        unit_serving_sodium_mg=float(row.get("unit_serving_sodium_mg", 0.0)),
        unit_serving_potassium_mg=float(row.get("unit_serving_potassium_mg", 0.0)),
        unit_serving_fibre_g=float(row.get("unit_serving_fibre_g", 0.0)),
        unit_serving_sfa_mg=float(row.get("unit_serving_sfa_mg", 0.0)),
    )


@router.post("/rank", response_model=RankedMealsResponse)
def get_ranked_meals(payload: RankMealsRequest) -> RankedMealsResponse:
    recipes = load_recipes()
    ranked_df = rank_meals(recipes, sodium_threshold_mg=payload.sodium_threshold_mg)

    if payload.diet_pref.lower() != "any":
        ranked_df = ranked_df[
            ranked_df["Diet_Type"].fillna("").str.lower() == payload.diet_pref.lower()
        ]

    top_df = ranked_df.head(payload.top_k)
    meals = [_to_meal_option(row, meal_slot="Ranked") for _, row in top_df.iterrows()]
    return RankedMealsResponse(total_meals=len(ranked_df), meals=meals)