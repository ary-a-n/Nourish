import type {
  AiDashRecipeListResponse,
  AiDashRecipeRequest,
  AiDashRecipeResponse,
  AiDashRecipeRecord,
  AuthUser,
  LoginRequest,
  LoginResponse,
  PlanResponse,
  RegisterRequest,
  RegisterResponse,
  SaveProfileRequest,
  SaveProfileResponse,
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
}
