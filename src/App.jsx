import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ProductionRideProvider } from './contexts/ProductionRideContext'
import ProtectedRoute from './components/ProtectedRoute'
import FloatingBackground from './components/FloatingBackground'
import AuthenticatedRoute from './components/AuthenticatedRoute'
import SupabaseSetup from './components/SupabaseSetup'

// Pages - Using optimized components
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import OptimizedDashboardSimple from './pages/OptimizedDashboardSimple'
import FindRides from './pages/FindRides'
import CreateRide from './pages/CreateRide'
import RideDetails from './pages/RideDetails'

// Create an inner component that has access to Router context
function AppContent() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [checkingConfig, setCheckingConfig] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url')
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_key')
    
    const configured = (
      supabaseUrl && supabaseKey && 
      !supabaseUrl.includes('placeholder') && 
      !supabaseKey.includes('placeholder') &&
      supabaseUrl !== 'https://placeholder.supabase.co' &&
      supabaseKey !== 'placeholder-key'
    )
    
    setIsConfigured(configured)
    setCheckingConfig(false)
  }, [])

  // Handle configuration updates
  const handleConfigured = () => {
    setIsConfigured(true)
    // Force refresh to ensure clean state
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  if (checkingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cu-red/10 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cu-red mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Campus Carpool Coordinator...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return <SupabaseSetup onConfigured={handleConfigured} />
  }

  return (
    <AuthProvider>
      <ProductionRideProvider>
          <div className="min-h-screen">
            <FloatingBackground />
            <Routes>
            {/* Public Routes - Always accessible */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes - Require authentication */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <OptimizedDashboardSimple />
              </ProtectedRoute>
            } />
            <Route path="/rides/find" element={
              <ProtectedRoute>
                <FindRides />
              </ProtectedRoute>
            } />
            <Route path="/rides/create" element={
              <ProtectedRoute>
                <CreateRide />
              </ProtectedRoute>
            } />
            <Route path="/create-ride" element={
              <ProtectedRoute>
                <CreateRide />
              </ProtectedRoute>
            } />
            <Route path="/find-rides" element={
              <ProtectedRoute>
                <FindRides />
              </ProtectedRoute>
            } />
            <Route path="/rides/:id" element={
              <ProtectedRoute>
                <RideDetails />
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'glass-card',
              style: {
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px)',
                color: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }
            }}
          />
        </div>
      </ProductionRideProvider>
    </AuthProvider>
  )
}

function App() {
  return (
    <Router 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppContent />
    </Router>
  )
}

export default App