import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import NotificationCenter from './NotificationCenter'
import { clearAllAuthState, debugAuthState } from '../utils/authUtils'
import { Menu, X, Home, Search, Plus, LayoutDashboard, User, LogOut, Bell, Bug } from 'lucide-react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, profile, signOut, isSupabaseConfigured } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Force immediate navigation and page refresh if needed
      navigate('/', { replace: true })
      // Small delay then force refresh if still showing logged in state
      setTimeout(() => {
        if (user) {
          window.location.href = '/'
        }
      }, 1000)
    } catch (error) {
      console.error('Logout error:', error)
      // Force navigation even on error
      navigate('/', { replace: true })
      window.location.href = '/'
    }
  }

  const handleDebugAuth = () => {
    debugAuthState()
  }

  const handleForceLogout = () => {
    clearAllAuthState()
    window.location.href = '/'
  }

  const navigation = user ? [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Find Rides', href: '/rides/find', icon: Search },
    { name: 'Offer Ride', href: '/rides/create', icon: Plus },
  ] : []

  // Show configuration warning if Supabase is not set up
  const showConfigWarning = user && !isSupabaseConfigured()

  return (
    <nav className="sticky-navbar">
      {/* Configuration Warning Banner */}
      {showConfigWarning && (
        <div className="mx-4 pt-4 pb-2">
          <div className="bg-amber-100 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2 text-amber-800">
              <span className="text-sm font-medium">
                ⚠️ Setup Required: Configure your Supabase database for full real-time functionality!
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="navbar-glass mx-4 my-2">
        <div className="page-container">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src="/cu_logo.png" alt="Chitkara University" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Campus Carpool</h1>
                <p className="text-sm text-slate-600">Chitkara University</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {user ? (
                <>
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                          location.pathname === item.href
                            ? 'bg-cu-red text-white shadow-lg'
                            : 'text-slate-700 hover:bg-white/20 hover:text-cu-red'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}
                  
                  {/* User Info & Notifications */}
                  <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/30">
                    <NotificationCenter />
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-cu-red text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden lg:block">
                        <p className="text-sm font-medium text-slate-800">
                          {profile?.full_name || user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-slate-600">
                          {profile?.department || user.user_metadata?.department || 'Student'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-700 hover:bg-white/20 hover:text-red-600 transition-all duration-200 ml-2"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                  
                  {/* Debug buttons for development */}
                  {(window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) && (
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={handleDebugAuth}
                        className="p-2 rounded-lg text-slate-500 hover:bg-white/20 hover:text-blue-600 transition-all duration-200"
                        title="Debug Auth State"
                      >
                        <Bug size={16} />
                      </button>
                      <button
                        onClick={handleForceLogout}
                        className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 transition-all duration-200"
                        title="Force Clear Auth"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <a href="#about" className="btn-ghost">About</a>
                  <Link to="/auth" className="btn-secondary">Sign In</Link>
                  <Link to="/auth" className="btn-primary">Get Started</Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {user && (
                <div className="glass-card p-2">
                  <NotificationCenter />
                </div>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/40 transition-all duration-200 hover:bg-white/30"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-white/20 pt-4 pb-2">
              <div className="flex flex-col space-y-2">
                {user ? (
                  <>
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-4 py-3 bg-white/10 rounded-lg mb-2">
                      <div className="w-12 h-12 bg-cu-red text-white rounded-full flex items-center justify-center font-bold">
                        {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {profile?.full_name || user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {profile?.department || user.user_metadata?.department || 'Student'}
                        </p>
                      </div>
                    </div>
                    
                    {navigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                            location.pathname === item.href
                              ? 'bg-cu-red text-white shadow-lg'
                              : 'text-slate-700 hover:bg-white/20 hover:text-cu-red'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      )
                    })}
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-white/20 hover:text-red-600 transition-all duration-200"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Sign Out</span>
                    </button>
                    
                    {/* Debug options for mobile */}
                    {(window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) && (
                      <div className="flex space-x-2 px-4 py-2">
                        <button
                          onClick={() => {
                            handleDebugAuth()
                            setIsMenuOpen(false)
                          }}
                          className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-all duration-200"
                        >
                          Debug Auth
                        </button>
                        <button
                          onClick={() => {
                            handleForceLogout()
                            setIsMenuOpen(false)
                          }}
                          className="flex-1 py-2 px-3 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-all duration-200"
                        >
                          Force Clear
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <a 
                      href="#about" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-slate-700 hover:bg-white/20 hover:text-cu-red rounded-lg transition-all duration-200"
                    >
                      About
                    </a>
                    <Link
                      to="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-center bg-white/20 backdrop-blur-md border border-white/40 text-cu-red hover:bg-white/30 rounded-lg transition-all duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-center bg-cu-red hover:bg-cu-red-dark text-white rounded-lg transition-all duration-200"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar