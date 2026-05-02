def calculate_dash_tdee_and_constraints(
    weight_kg: float,
    height_cm: float,
    age_years: int,
    gender: str,
    activity_level: str,
    bp_stage: str,
) -> dict[str, int | dict[str, int]]:
    if gender.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age_years + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age_years - 161

    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
    }
    indian_tdee = (bmr * multipliers.get(activity_level.lower(), 1.2)) * 0.95

    sodium_daily = {"pre": 2300, "stage1": 2000, "stage2": 1500}
    dash_limit = sodium_daily[bp_stage.lower()]

    meals = {
        "Breakfast": round(indian_tdee * 0.25),
        "Lunch": round(indian_tdee * 0.30),
        "Dinner": round(indian_tdee * 0.30),
        "Snack": round(indian_tdee * 0.075),
    }

    return {
        "indian_tdee": round(indian_tdee),
        "meal_calories": meals,
        "sodium_per_main": round(dash_limit * 0.25),
        "sodium_per_snack": round(dash_limit * 0.075),
        "daily_sodium_limit": dash_limit,
    }
