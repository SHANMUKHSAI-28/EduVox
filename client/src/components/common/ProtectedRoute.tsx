import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/auth/login'
}) => {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  if (requireAuth && !currentUser) {
    // Redirect to login with the current location
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (!requireAuth && currentUser) {
    // User is logged in but trying to access auth pages
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
