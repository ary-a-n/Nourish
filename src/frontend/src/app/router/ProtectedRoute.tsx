import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getAccessToken } from '../../shared/lib/auth'

export function ProtectedRoute() {
  const location = useLocation()
  const token = getAccessToken()

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <Outlet />
}
