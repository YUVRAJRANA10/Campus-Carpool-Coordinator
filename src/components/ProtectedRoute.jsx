import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const ProtectedRoute = ({ children }) => {
  const { user, loading, session } = useAuth()
  const location = useLocation()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    // Give auth context time to initialize
    const timer = setTimeout(() => {
      setHasCheckedAuth(true)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  // Still loading or haven't checked auth yet
  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cu-red mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // No user or session - redirect to auth
  if (!user || !session) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute