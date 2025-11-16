import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, authHelpers } from '../utils/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check if Supabase is configured before attempting session
        if (!isSupabaseConfigured()) {
          if (isMounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
            setLoading(false)
            setInitializing(false)
          }
          return
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          // Clear state on session error
          if (isMounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        } else if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          // Fetch user profile if user exists
          if (session?.user) {
            try {
              const userProfile = await authHelpers.getUserProfile(session.user.id)
              if (isMounted) setProfile(userProfile)
            } catch (profileError) {
              console.warn('Profile not found, this is normal for new users:', profileError)
              if (isMounted) {
                // Create a basic profile from user metadata if none exists
                setProfile({
                  id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || '',
                  department: session.user.user_metadata?.department || '',
                  role: session.user.user_metadata?.role || 'student',
                  email: session.user.email
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitializing(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const userProfile = await authHelpers.getUserProfile(session.user.id)
            setProfile(userProfile)
          } catch (error) {
            console.warn('Profile not found, this is normal for new users:', error)
            // Create a basic profile from user metadata if none exists
            setProfile({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || '',
              department: session.user.user_metadata?.department || '',
              role: session.user.user_metadata?.role || 'student',
              email: session.user.email
            })
          }
        } else {
          setProfile(null)
        }
        
        setLoading(false)
        setInitializing(false)

        if (event === 'SIGNED_IN') {
          toast.success('Welcome to Campus Carpool! 🚗')
        } else if (event === 'SIGNED_OUT') {
          toast.success('See you later! 👋')
        }
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (formData) => {
    try {
      setLoading(true)
      const { email, password, fullName, role, department } = formData
      
      // Validate Chitkara email
      if (!email || !email.endsWith('@chitkara.edu.in')) {
        throw new Error('Please use your official Chitkara University email address (@chitkara.edu.in)')
      }

      const userData = {
        full_name: fullName,
        role: role || 'student',
        department: department || ''
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile in database
        try {
          await authHelpers.createProfile(data.user.id, {
            full_name: fullName,
            email: email,
            role: role || 'student',
            department: department || '',
            phone: '',
            student_id: '',
            university_year: null,
            rating: 5.0,
            total_rides: 0,
            bio: ''
          })
        } catch (profileError) {
          console.warn('Profile creation failed, but signup successful:', profileError)
        }
      }

      if (data.user && !data.session) {
        toast.success('🎉 Account created! Please check your email for verification link.')
      } else if (data.session) {
        toast.success('🎉 Welcome to Campus Carpool!')
        navigate('/dashboard')
      }

      return { data, error: null }
    } catch (error) {
      let errorMessage = error.message
      if (error.message.includes('User already registered')) {
        errorMessage = 'Account already exists. Try signing in instead!'
      }
      toast.error(errorMessage)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      
      if (data.session) {
        navigate('/dashboard')
      }
      
      return { data, error: null }
    } catch (error) {
      let errorMessage = error.message
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account first.'
      }
      toast.error(errorMessage)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      // Sign out from Supabase if configured
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signOut({ scope: 'global' })
        if (error) {
          console.warn('Supabase sign out warning:', error)
          // Continue with local cleanup even if Supabase fails
        }
      }
      
      // Force clear all authentication state immediately
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Clear all possible localStorage/sessionStorage auth data
      try {
        localStorage.removeItem('sb-' + (import.meta.env.VITE_SUPABASE_URL || '').split('//')[1]?.split('.')[0] + '-auth-token')
        sessionStorage.clear()
      } catch (e) {
        console.warn('Storage clear warning:', e)
      }
      
      // Force immediate navigation
      navigate('/', { replace: true })
      toast.success('Signed out successfully! 👋')
    } catch (error) {
      console.error('Sign out error:', error)
      // Force clear state even if everything fails
      setUser(null)
      setProfile(null)
      setSession(null)
      navigate('/', { replace: true })
      toast.success('Signed out! 👋')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      const updatedProfile = await authHelpers.updateProfile(user.id, {
        ...updates,
        updated_at: new Date().toISOString()
      })
      
      setProfile(updatedProfile)
      toast.success('Profile updated successfully! ✅')
      return updatedProfile
    } catch (error) {
      console.error('Update profile error:', error.message)
      toast.error('Failed to update profile')
      throw error
    }
  }

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url')
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_key')
    return url && key && url !== 'https://placeholder.supabase.co' && key !== 'placeholder-key'
  }

  const value = {
    user,
    profile,
    session,
    loading: loading || initializing,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    isSupabaseConfigured
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}