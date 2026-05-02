export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type BPStage = 'pre' | 'stage1' | 'stage2'

export type PatientProfile = {
  name: string
  weight_kg: number
  height_cm: number
  age_years: number
  gender: Gender
  activity_level: ActivityLevel
  bp_stage: BPStage
  diet_pref: string
}

export type AuthUser = {
  id: string
  name: string
  mobile: string
}

export type RegisterRequest = {
  name: string
  mobile: string
  password: string
}

export type RegisterResponse = {
  user: AuthUser
}

export type LoginRequest = {
  mobile: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  expires_at: string
  user: AuthUser
}

export type SaveProfileRequest = {
  profile: PatientProfile
}

export type SaveProfileResponse = {
  profile: PatientProfile
}

export type ConstraintsResponse = {
  indian_tdee: number
  meal_calories: Record<string, number>
  sodium_per_main: number
  sodium_per_snack: number
  daily_sodium_limit: number
}

export type MealOption = {
  meal_slot: string
  course_type: string
  diet_type: string
  food_name: string
  dash_score: number
  unit_serving_energy_kcal: number
  unit_serving_sodium_mg: number
  unit_serving_potassium_mg: number
  unit_serving_fibre_g: number
  unit_serving_sfa_mg: number
}

export type PlanResponse = {
  constraints: ConstraintsResponse
  total_options: number
  plan: MealOption[]
}

// ── AI Kitchen (DASH recipe generator) ─────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type DietPreference = 'veg' | 'non-veg' | 'any'

export type AiDashRecipeRequest = {
  meal_type: MealType
  diet_pref: DietPreference
  available_items: string[]
  health_constraints?: string[]
  allergies?: string[]
  cuisine?: string
  time_minutes?: number
  servings?: number
  notes?: string
}

export type AiDashRecipe = {
  title: string
  servings: number
  prep_time_minutes: number
  cook_time_minutes: number
  ingredients: Array<{
    item: string
    quantity: string | number
    unit: string
  }>
  steps: string[]
  dash_notes: string[]
  nutrition_summary?: {
    total_kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
  }
  data_sources?: string[]
}

export type AiDashRecipeResponse = {
  recipe: AiDashRecipe
  created_at: string
}

export type AiDashRecipeRecord = {
  id: string
  recipe: AiDashRecipe
  created_at: string
}

export type AiDashRecipeListResponse = {
  total: number
  items: AiDashRecipeRecord[]
}
