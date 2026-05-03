export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type BPStage = 'pre' | 'stage1' | 'stage2'
export type UserRole = 'patient' | 'dietician'

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
  role: UserRole
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

// ── Dietician ──────────────────────────────────────────────────────────────
export type DieticianPatient = {
  id: string
  name: string
  mobile: string
  assigned: boolean
  last_plan_status?: 'draft' | 'approved' | 'rejected'
}

export type DieticianPatientListResponse = {
  total: number
  patients: DieticianPatient[]
}

export type DieticianAssignmentResponse = {
  id: string
  dietician_id: string
  patient_id: string
  created_at: string
}

export type DieticianPlanItem = {
  id: string
  meal_slot: string
  source_type: 'dataset' | 'ai'
  payload_json: unknown
}

export type DieticianPlan = {
  id: string
  patient_id: string
  status: 'draft' | 'approved' | 'rejected' | 'superseded'
  created_by: string
  approved_by: string | null
  created_at: string
  updated_at: string
  items: DieticianPlanItem[]
}

export type DieticianPlanResponse = {
  plan: DieticianPlan
}

export type DieticianPlanItemInput = {
  meal_slot: string
  source_type: 'dataset' | 'ai'
  payload_json: unknown
}

export type DieticianPlanUpdateRequest = {
  status?: 'draft' | 'approved' | 'rejected'
  items?: DieticianPlanItemInput[]
}

export type RankMealsRequest = {
  diet_pref: string
  sodium_threshold_mg?: number
  top_k: number
}

export type RankedMealsResponse = {
  total_meals: number
  meals: MealOption[]
}

export type DieticianAiKitchenRequest = {
  meal_slot: string
  recipe: AiDashRecipe
}

export type PatientPlanItem = {
  meal_slot: string
  source_type: 'dataset' | 'ai'
  payload_json: unknown
}

export type PatientPlanResponse = {
  plan_id: string | null
  status: 'approved' | 'rejected' | 'draft' | 'superseded' | null
  items: PatientPlanItem[]
}
