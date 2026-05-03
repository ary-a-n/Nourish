import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import { AuthPage } from '../../features/auth/AuthPage'
import { DashboardPage } from '../../features/dashboard/DashboardPage'
import { DieticianDashboard } from '../../features/dashboard/DieticianDashboard'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dietician" element={<DieticianDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
