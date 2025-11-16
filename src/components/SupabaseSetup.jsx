import { useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Key, CheckCircle, AlertCircle, ExternalLink, Copy, FileText } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { healthCheck, getManualSetupSQL } from '../utils/databaseSetup'
import toast from 'react-hot-toast'

const SupabaseSetup = ({ onConfigured }) => {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({
    url: '',
    key: ''
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [dbHealth, setDbHealth] = useState(null)
  const [showSQL, setShowSQL] = useState(false)

  const testConnection = async () => {
    if (!config.url || !config.key) {
      toast.error('Please enter both URL and API key')
      return
    }

    setTesting(true)
    setTestResult(null)
    setDbHealth(null)

    try {
      // Create temporary client for testing
      const testSupabase = createClient(config.url, config.key)
      
      // Test basic connection first
      const { data: authData, error: authError } = await testSupabase.auth.getUser()
      
      if (authError && !authError.message.includes('session')) {
        throw new Error(`Authentication test failed: ${authError.message}`)
      }

      // Test database access and table health
      const healthResult = await healthCheck()
      setDbHealth(healthResult)
      
      if (!healthResult.connected) {
        throw new Error(`Database connection failed: ${healthResult.error}`)
      }

      // Check if required tables exist
      const missingTables = healthResult.tables.filter(table => !table.accessible)
      
      if (missingTables.length > 0) {
        setTestResult({ 
          success: false, 
          message: `Missing database tables: ${missingTables.map(t => t.table).join(', ')}. Please run the setup SQL.`,
          showSetup: true
        })
        setShowSQL(true)
        return
      }

      setTestResult({ success: true, message: 'Connection and database setup verified!' })
      toast.success('🎉 Supabase connected and database ready!')
      
      // Save to localStorage for immediate use
      localStorage.setItem('supabase_url', config.url)
      localStorage.setItem('supabase_key', config.key)
      
      setTimeout(() => {
        onConfigured()
      }, 1500)

    } catch (error) {
      console.error('Connection test error:', error)
      setTestResult({ success: false, message: error.message })
      toast.error('Connection failed. Please check your credentials.')
    } finally {
      setTesting(false)
    }
  }

  const copySQL = () => {
    navigator.clipboard.writeText(getManualSetupSQL())
    toast.success('SQL copied to clipboard!')
  }

  const saveToEnvFile = () => {
    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${config.url}
VITE_SUPABASE_ANON_KEY=${config.key}

# Optional: Additional configuration
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_APP_ENV=production
`

    const blob = new Blob([envContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env.local'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Environment file downloaded! Place it in your project root.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cu-red/10 via-white to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cu-red rounded-full mb-4">
            <Database size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            🚀 Production Setup Required
          </h1>
          <p className="text-slate-600 text-lg">
            Connect your Supabase database to enable real-time features
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-xl">
          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-cu-red text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
                  Get Your Supabase Credentials
                </h2>
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-slate-700 mb-3">
                    <strong>Don't have a Supabase project?</strong>
                  </p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>1. Go to <strong>supabase.com</strong> and create an account</p>
                    <p>2. Create a new project</p>
                    <p>3. Go to <strong>Settings → API</strong> in your project dashboard</p>
                    <p>4. Copy your <strong>Project URL</strong> and <strong>anon key</strong></p>
                  </div>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Open Supabase Dashboard
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Supabase Project URL *
                  </label>
                  <input
                    type="url"
                    value={config.url}
                    onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cu-red focus:border-transparent"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Found in Settings → API → Project URL
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Supabase Anon Key *
                  </label>
                  <input
                    type="password"
                    value={config.key}
                    onChange={(e) => setConfig(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cu-red focus:border-transparent"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Found in Settings → API → Project API keys → anon key
                  </p>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={testConnection}
                  disabled={!config.url || !config.key || testing}
                  className="flex-1 bg-cu-red text-white py-3 px-6 rounded-lg font-semibold hover:bg-cu-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Key size={18} className="mr-2" />
                      Test & Save Configuration
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-4 rounded-lg flex items-center ${
                    testResult.success 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle size={20} className="mr-3 text-green-600" />
                  ) : (
                    <AlertCircle size={20} className="mr-3 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {testResult.success ? 'Success!' : 'Error'}
                    </p>
                    <p className="text-sm">{testResult.message}</p>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Production Setup Only */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-3">
                Need help setting up your database?
              </p>
              <a
                href="https://supabase.com/docs/guides/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cu-red hover:text-cu-red-dark font-medium text-sm"
              >
                View Setup Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/50">
          <h3 className="font-semibold text-slate-800 mb-4">🚀 What you'll get after setup:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="flex items-center">
              <CheckCircle size={16} className="text-green-500 mr-2" />
              Real-time ride updates
            </div>
            <div className="flex items-center">
              <CheckCircle size={16} className="text-green-500 mr-2" />
              Instant booking notifications
            </div>
            <div className="flex items-center">
              <CheckCircle size={16} className="text-green-500 mr-2" />
              Live driver-passenger chat
            </div>
            <div className="flex items-center">
              <CheckCircle size={16} className="text-green-500 mr-2" />
              Enterprise-grade performance
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SupabaseSetup