import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// This component redirects authenticated users to the dashboard
// and shows the content to non-authenticated users
const AuthenticatedRoute = ({ children }) => {
  const { user } = useAuth()
  
  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  // If user is not authenticated, show the content (landing page)
  return children
}

export default AuthenticatedRoute