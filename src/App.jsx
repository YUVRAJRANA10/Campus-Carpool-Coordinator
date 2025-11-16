import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { RideProvider } from './contexts/RideContext'
import { RealTimeRideProvider } from './contexts/RealTimeRideContext'
import ProtectedRoute from './components/ProtectedRoute'
import FloatingBackground from './components/FloatingBackground'
import AuthenticatedRoute from './components/AuthenticatedRoute'

// Pages - Using optimized components
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import OptimizedDashboardSimple from './pages/OptimizedDashboardSimple'
import FindRides from './pages/FindRides'
import CreateRide from './pages/CreateRide'
import RideDetails from './pages/RideDetails'

// Create an inner component that has access to Router context
function AppContent() {
  return (
    <AuthProvider>
      <RealTimeRideProvider>
        <RideProvider>
          <div className="min-h-screen">
            <FloatingBackground />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <AuthenticatedRoute>
                <LandingPage />
              </AuthenticatedRoute>
            } />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes - Using Optimized Components */}
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
      </RideProvider>
      </RealTimeRideProvider>
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