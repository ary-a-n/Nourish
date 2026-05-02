from functools import lru_cache

import pandas as pd

from app.core.config import DEFAULT_DATA_FILE


REQUIRED_COLUMNS = {
    "food_name",
    "Course_Type",
    "Diet_Type",
    "unit_serving_energy_kcal",
    "unit_serving_fibre_g",
    "unit_serving_potassium_mg",
    "unit_serving_magnesium_mg",
    "unit_serving_calcium_mg",
    "unit_serving_protein_g",
    "unit_serving_sodium_mg",
    "unit_serving_sfa_mg",
    "unit_serving_freesugar_g",
}


@lru_cache(maxsize=1)
def load_recipes() -> pd.DataFrame:
    if not DEFAULT_DATA_FILE.exists():
        raise FileNotFoundError(f"Data file not found: {DEFAULT_DATA_FILE}")

    df = pd.read_csv(DEFAULT_DATA_FILE)
    missing = REQUIRED_COLUMNS.difference(df.columns)
    if missing:
        missing_cols = ", ".join(sorted(missing))
        raise ValueError(f"Dataset missing required columns: {missing_cols}")
    return df
