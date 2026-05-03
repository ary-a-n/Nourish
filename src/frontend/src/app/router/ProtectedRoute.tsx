import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CircularProgress, Box } from '@mui/material'

import { getAccessToken } from '../../shared/lib/auth'
import { apiClient } from '../../shared/api/client'

export function ProtectedRoute() {
  const location = useLocation()
  const token = getAccessToken()

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: apiClient.me,
    enabled: !!token,
    retry: false,
  })

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return <Navigate to="/auth" replace />
  }

  // Role-based routing
  if (user?.role === 'dietician' && location.pathname === '/dashboard') {
    return <Navigate to="/dietician" replace />
  }

  if (user?.role === 'patient' && location.pathname === '/dietician') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
