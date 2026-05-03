import type {
  AiDashRecipeListResponse,
  AiDashRecipeRequest,
  AiDashRecipeResponse,
  AiDashRecipeRecord,
  AuthUser,
  DieticianAssignmentResponse,
  DieticianPatientListResponse,
  DieticianPlanResponse,
  DieticianPlanUpdateRequest,
  LoginRequest,
  LoginResponse,
  PatientPlanResponse,
  PlanResponse,
  RegisterRequest,
  RegisterResponse,
  SaveProfileRequest,
  SaveProfileResponse,
  PatientProfile,
  MealOption,
  AiDashRecipe,
} from '../types/api'
import { request } from '../lib/http'

export const apiClient = {
  register: (payload: RegisterRequest) =>
    request<RegisterResponse>('/v1/auth/register', {
      method: 'POST',
      body: payload,
    }),

  login: (payload: LoginRequest) =>
    request<LoginResponse>('/v1/auth/login', {
      method: 'POST',
      body: payload,
    }),

  dieticianRegister: (payload: RegisterRequest) =>
    request<RegisterResponse>('/v1/dietician/register', {
      method: 'POST',
      body: payload,
    }),

  dieticianLogin: (payload: LoginRequest) =>
    request<LoginResponse>('/v1/dietician/login', {
      method: 'POST',
      body: payload,
    }),

  me: () =>
    request<AuthUser>('/v1/auth/me', {
      auth: true,
    }),

  logout: () =>
    request<{ detail: string }>('/v1/auth/logout', {
      method: 'POST',
      auth: true,
    }),

  getProfile: () =>
    request<SaveProfileResponse>('/v1/profile', {
      auth: true,
    }),

  saveProfile: (payload: SaveProfileRequest) =>
    request<SaveProfileResponse>('/v1/profile', {
      method: 'PUT',
      auth: true,
      body: payload,
    }),

  getMyPlan: () =>
    request<PatientPlanResponse>('/v1/plan/me', { auth: true }),

  generateMyPlan: (params: {
    options_per_slot?: number
    top_n_pool?: number
    random_seed?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params.options_per_slot !== undefined) {
      searchParams.set('options_per_slot', `${params.options_per_slot}`)
    }
    if (params.top_n_pool !== undefined) {
      searchParams.set('top_n_pool', `${params.top_n_pool}`)
    }
    if (params.random_seed !== undefined) {
      searchParams.set('random_seed', `${params.random_seed}`)
    }
    const query = searchParams.toString()
    const path = query ? `/v1/plan/generate/me?${query}` : '/v1/plan/generate/me'
    return request<PlanResponse>(path, {
      method: 'POST',
      auth: true,
    })
  },

  generateDashRecipe: (payload: AiDashRecipeRequest) =>
    request<AiDashRecipeResponse>('/v1/recipes/dash/generate', {
      method: 'POST',
      auth: true,
      body: payload,
    }),

  listDashRecipes: (params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit !== undefined) searchParams.set('limit', `${params.limit}`)
    if (params?.offset !== undefined) searchParams.set('offset', `${params.offset}`)
    const query = searchParams.toString()
    const path = query ? `/v1/recipes/dash?${query}` : '/v1/recipes/dash'
    return request<AiDashRecipeListResponse>(path, { auth: true })
  },

  getDashRecipe: (recipeId: string) =>
    request<AiDashRecipeRecord>(`/v1/recipes/dash/${recipeId}`, { auth: true }),

  // ── Dietician ────────────────────────────────────────────────────────────
  listDieticianPatients: () =>
    request<DieticianPatientListResponse>('/v1/dietician/patients', { auth: true }),

  assignPatient: (patientId: string) =>
    request<DieticianAssignmentResponse>(`/v1/dietician/patients/${patientId}/assign`, {
      method: 'POST',
      auth: true,
    }),

  unassignPatient: (patientId: string) =>
    request<void>(`/v1/dietician/patients/${patientId}/assign`, {
      method: 'DELETE',
      auth: true,
    }),

  getPatientRecipes: (patientId: string, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit !== undefined) searchParams.set('limit', `${params.limit}`)
    if (params?.offset !== undefined) searchParams.set('offset', `${params.offset}`)
    const query = searchParams.toString()
    const path = query
      ? `/v1/dietician/patients/${patientId}/recipes?${query}`
      : `/v1/dietician/patients/${patientId}/recipes`
    return request<AiDashRecipeListResponse>(path, { auth: true })
  },

  createPatientPlan: (patientId: string) =>
    request<DieticianPlanResponse>(`/v1/dietician/patients/${patientId}/plan`, {
      method: 'POST',
      auth: true,
    }),

  getPatientPlan: (patientId: string) =>
    request<DieticianPlanResponse>(`/v1/dietician/patients/${patientId}/plan`, { auth: true }),

  getPatientProfile: (patientId: string) =>
    request<PatientProfile>(`/v1/dietician/patients/${patientId}/profile`, { auth: true }),

  updatePatientProfile: (patientId: string, payload: PatientProfile) =>
    request<PatientProfile>(`/v1/dietician/patients/${patientId}/profile`, {
      method: 'PUT',
      auth: true,
      body: payload,
    }),

  getRankedMeals: (payload: { diet_pref: string; sodium_threshold_mg?: number; top_k: number }) =>
    request<{ total_meals: number; meals: MealOption[] }>('/v1/meals/rank', {
      method: 'POST',
      body: payload,
    }),

  attachDieticianAiRecipe: (planId: string, payload: { meal_slot: string; recipe: AiDashRecipe }) =>
    request<DieticianPlanResponse>(`/v1/dietician/plans/${planId}/ai-kitchen`, {
      method: 'POST',
      auth: true,
      body: payload,
    }),

  updatePatientPlan: (planId: string, payload: DieticianPlanUpdateRequest) =>
    request<DieticianPlanResponse>(`/v1/dietician/plans/${planId}`, {
      method: 'PATCH',
      auth: true,
      body: payload,
    }),
}
