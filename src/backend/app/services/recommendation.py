import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


CRITICAL_COLS = [
    "unit_serving_fibre_g",
    "unit_serving_potassium_mg",
    "unit_serving_magnesium_mg",
    "unit_serving_calcium_mg",
    "unit_serving_protein_g",
    "unit_serving_sodium_mg",
    "unit_serving_sfa_mg",
    "unit_serving_freesugar_g",
]

METRICS_TO_SCALE = CRITICAL_COLS.copy()


def clean_recipes(df: pd.DataFrame) -> pd.DataFrame:
    return df.dropna(subset=CRITICAL_COLS).copy()


def apply_sodium_safety_filter(df: pd.DataFrame, sodium_threshold_mg: float = 800) -> pd.DataFrame:
    return df[df["unit_serving_sodium_mg"] <= sodium_threshold_mg].copy()


def _calculate_weighted_dash_score(row: pd.Series) -> float:
    fiber_pts = row["unit_serving_fibre_g"] * 5.0
    potassium_pts = row["unit_serving_potassium_mg"] * 3.5
    magnesium_pts = row["unit_serving_magnesium_mg"] * 2.0
    calcium_pts = row["unit_serving_calcium_mg"] * 2.0
    protein_pts = row["unit_serving_protein_g"] * 1.0

    sodium_pen = row["unit_serving_sodium_mg"] * 4.0
    sat_fat_pen = row["unit_serving_sfa_mg"] * 3.0
    sugar_pen = row["unit_serving_freesugar_g"] * 2.0

    rewards = fiber_pts + potassium_pts + magnesium_pts + calcium_pts + protein_pts
    penalties = sodium_pen + sat_fat_pen + sugar_pen
    return round((rewards - penalties), 3)


def rank_meals(df: pd.DataFrame, sodium_threshold_mg: float = 800) -> pd.DataFrame:
    cleaned_df = clean_recipes(df)
    safe_df = apply_sodium_safety_filter(cleaned_df, sodium_threshold_mg=sodium_threshold_mg)
    if safe_df.empty:
        return safe_df

    scaler = StandardScaler()
    scaled_df = safe_df.copy()
    scaled_df[METRICS_TO_SCALE] = scaler.fit_transform(safe_df[METRICS_TO_SCALE])

    ranked_df = safe_df.copy()
    ranked_df["DASH_Score"] = scaled_df.apply(_calculate_weighted_dash_score, axis=1)
    return ranked_df.sort_values(by="DASH_Score", ascending=False)


def generate_personalized_exchange_plan(
    ranked_df: pd.DataFrame,
    constraints: dict,
    patient_diet_pref: str = "Any",
    options_per_slot: int = 3,
    top_n_pool: int = 15,
    random_seed: int | None = None,
) -> pd.DataFrame:
    if ranked_df.empty:
        return pd.DataFrame()

    if patient_diet_pref.lower() != "any":
        personal_df = ranked_df[
            ranked_df["Diet_Type"].fillna("").str.lower() == patient_diet_pref.lower()
        ].copy()
    else:
        personal_df = ranked_df.copy()

    slots = [
        ("Breakfast", constraints["meal_calories"]["Breakfast"], constraints["sodium_per_main"], 200, ["Breakfast"]),
        ("Lunch", constraints["meal_calories"]["Lunch"], constraints["sodium_per_main"], 250, ["Main Course"]),
        ("Dinner", constraints["meal_calories"]["Dinner"], constraints["sodium_per_main"], 250, ["Main Course"]),
        (
            "Snack 1",
            constraints["meal_calories"]["Snack"],
            constraints["sodium_per_snack"],
            100,
            ["Snack", "Beverage/Side"],
        ),
        (
            "Snack 2",
            constraints["meal_calories"]["Snack"],
            constraints["sodium_per_snack"],
            100,
            ["Snack", "Beverage/Side"],
        ),
    ]

    rng = np.random.default_rng(random_seed)
    full_exchange_list: list[pd.DataFrame] = []
    used_indices: set[int] = set()

    for slot_name, target_cal, max_na, tolerance, allowed_courses in slots:
        appropriate_foods = personal_df[personal_df["Course_Type"].isin(allowed_courses)]

        valid_pool = appropriate_foods[
            (appropriate_foods["unit_serving_energy_kcal"].between(target_cal - tolerance, target_cal + tolerance))
            & (appropriate_foods["unit_serving_sodium_mg"] <= max_na)
            & (~appropriate_foods.index.isin(used_indices))
        ].copy()

        if valid_pool.empty:
            continue

        top_pool = valid_pool.sort_values(by="DASH_Score", ascending=False).head(top_n_pool)
        sample_size = min(options_per_slot, len(top_pool))
        random_state = int(rng.integers(0, 2**31 - 1))
        selected_meals = top_pool.sample(n=sample_size, random_state=random_state)
        selected_meals["Meal_Slot"] = slot_name
        selected_meals["Target_Kcal"] = target_cal

        used_indices.update(selected_meals.index.tolist())
        full_exchange_list.append(selected_meals)

    if not full_exchange_list:
        return pd.DataFrame()
    return pd.concat(full_exchange_list)
