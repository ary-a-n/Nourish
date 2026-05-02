const AUTH_TOKEN_KEY = 'nourish_access_token'

export function setAccessToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function clearAccessToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
