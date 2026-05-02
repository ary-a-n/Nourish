from typing import Literal

from pydantic import BaseModel, Field


Gender = Literal["male", "female"]
ActivityLevel = Literal["sedentary", "light", "moderate", "active"]
BPStage = Literal["pre", "stage1", "stage2"]


class PatientProfile(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    weight_kg: float = Field(gt=0)
    height_cm: float = Field(gt=0)
    age_years: int = Field(gt=0)
    gender: Gender
    activity_level: ActivityLevel
    bp_stage: BPStage
    diet_pref: str = "Any"


class RankMealsRequest(BaseModel):
    diet_pref: str = "Any"
    top_k: int = Field(default=20, ge=1, le=200)
    sodium_threshold_mg: float = Field(default=800, gt=0)


class PlanRequest(BaseModel):
    profile: PatientProfile
    options_per_slot: int = Field(default=3, ge=1, le=10)
    top_n_pool: int = Field(default=15, ge=1, le=100)
    random_seed: int | None = None


class ConstraintsRequest(BaseModel):
    profile: PatientProfile


class AuthRegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    mobile: str = Field(min_length=13, max_length=13)
    password: str = Field(min_length=6, max_length=128)


class AuthLoginRequest(BaseModel):
    mobile: str = Field(min_length=13, max_length=13)
    password: str = Field(min_length=6, max_length=128)


class AuthUser(BaseModel):
    id: str
    name: str
    mobile: str


class AuthRegisterResponse(BaseModel):
    user: AuthUser


class AuthLoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_at: str
    user: AuthUser


class SaveProfileRequest(BaseModel):
    profile: PatientProfile


class SaveProfileResponse(BaseModel):
    profile: PatientProfile


class ConstraintsResponse(BaseModel):
    indian_tdee: int
    meal_calories: dict[str, int]
    sodium_per_main: int
    sodium_per_snack: int
    daily_sodium_limit: int


class MealOption(BaseModel):
    meal_slot: str
    course_type: str
    diet_type: str
    food_name: str
    dash_score: float
    unit_serving_energy_kcal: float
    unit_serving_sodium_mg: float
    unit_serving_potassium_mg: float
    unit_serving_fibre_g: float
    unit_serving_sfa_mg: float


class RankedMealsResponse(BaseModel):
    total_meals: int
    meals: list[MealOption]


class PlanResponse(BaseModel):
    constraints: ConstraintsResponse
    total_options: int
    plan: list[MealOption]


MealType = Literal["breakfast", "lunch", "dinner", "snack"]
DietPreference = Literal["veg", "non-veg", "any"]


class AiDashRecipeRequest(BaseModel):
    meal_type: MealType
    diet_pref: DietPreference
    available_items: list[str] = Field(min_length=1)
    health_constraints: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    cuisine: str | None = None
    time_minutes: int | None = Field(default=None, gt=0)
    servings: int = Field(default=1, ge=1, le=8)
    notes: str | None = None

class NutritionSummary(BaseModel):
    total_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float

class AiDashRecipe(BaseModel):
    title: str
    servings: int
    prep_time_minutes: int
    cook_time_minutes: int
    ingredients: list[dict]
    steps: list[str]
    dash_notes: list[str]
    nutrition_summary: NutritionSummary | None = None
    data_sources: list[str] | None = None


class AiDashRecipeResponse(BaseModel):
    recipe: AiDashRecipe
    created_at: str


class AiDashRecipeRecord(BaseModel):
    id: str
    recipe: AiDashRecipe
    created_at: str


class AiDashRecipeListResponse(BaseModel):
    total: int
    items: list[AiDashRecipeRecord]
