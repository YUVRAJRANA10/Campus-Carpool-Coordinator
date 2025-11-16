import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, GraduationCap, Car } from 'lucide-react'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    department: ''
  })
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (!error) {
          navigate('/dashboard')
        }
      } else {
        const signUpData = {
          email: formData.email,
          password: formData.password,
          fullName: formData.full_name,
          role: formData.role,
          department: formData.department
        }
        const { error } = await signUp(signUpData)
        if (!error) {
          setIsLogin(true) // Switch to login after successful signup
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex pt-16">
      {/* Left Side - Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cu-red to-cu-orange p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <img src="/cu_logo.png" alt="Chitkara University" className="h-16 w-16" />
              <div>
                <h1 className="text-2xl font-bold">Campus Carpool</h1>
                <p className="opacity-90">Chitkara University</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold mb-6">
              {isLogin ? 'Welcome Back!' : 'Join Our Community'}
            </h2>
            
            <p className="text-xl opacity-90 mb-8">
              {isLogin 
                ? 'Sign in to access your rides, bookings, and connect with the Chitkara transportation community.'
                : 'Create your account with university credentials and become part of Chitkara\'s transportation network.'
              }
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">🔐</div>
                <span>Secure verification with university email</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <span>Easy ride sharing and booking system</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">💰</div>
                <span>Save money on transportation costs</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">👥</div>
                <span>Connect with verified students and staff</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/5 rounded-full animate-float" />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <Link 
                to="/" 
                className="inline-flex items-center text-slate-600 hover:text-cu-red mb-6 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Home
              </Link>
              
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-slate-600">
                {isLogin ? 'Welcome back to Campus Carpool' : 'Join the Chitkara transportation community'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="input-glass pl-10 w-full"
                        placeholder="Enter your full name"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Role
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="input-glass w-full"
                        required={!isLogin}
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="official">Official</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Department
                      </label>
                      <div className="relative">
                        <GraduationCap size={18} className="absolute left-3 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="input-glass pl-10 w-full"
                          placeholder="e.g., CSE"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  University Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-glass pl-10 w-full"
                    placeholder="your.email@chitkara.edu.in"
                    required
                  />
                </div>
                {!isLogin && !formData.email.endsWith('@chitkara.edu.in') && formData.email && (
                  <p className="text-sm text-red-600">Please use your official Chitkara University email</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-glass pl-10 pr-10 w-full"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (!isLogin && !formData.email.endsWith('@chitkara.edu.in'))}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="text-center mt-6 pt-6 border-t border-white/20">
              <p className="text-slate-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-cu-red font-semibold ml-1 hover:underline"
                >
                  {isLogin ? 'Sign up here' : 'Sign in here'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage