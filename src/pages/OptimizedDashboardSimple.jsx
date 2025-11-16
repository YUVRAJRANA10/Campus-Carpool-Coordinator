import React, { useState, useMemo, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRides } from '../contexts/RideContext'
import { useRealTimeRides } from '../contexts/RealTimeRideContext'
import { usePerformance, withPerformanceTracking } from '../contexts/PerformanceContext'
import Navbar from '../components/Navbar'
import DriverDashboard from '../components/DriverDashboard'
import { 
  Car, 
  Calendar, 
  DollarSign, 
  Star, 
  Users, 
  Plus, 
  Search,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  TrendingUp,
  Leaf,
  Award,
  ArrowUpRight,
  Loader2
} from 'lucide-react'

// Memoized components for better performance
const StatCard = React.memo(({ title, value, subtitle, icon: Icon, color, change }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`p-6 rounded-xl bg-gradient-to-br ${color} text-white relative overflow-hidden`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-white/20 rounded-lg">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-xs text-white/80">{change}</div>
    </div>
    <div className="space-y-1">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-white/90">{title}</div>
      <div className="text-xs text-white/70">{subtitle}</div>
    </div>
    <div className="absolute -bottom-2 -right-2 opacity-20">
      <Icon className="w-16 h-16" />
    </div>
  </motion.div>
))

StatCard.displayName = 'StatCard'

const RecentActivity = React.memo(({ activities, isLoading }) => {
  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const activityDate = new Date(timestamp)
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!activities.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium">No recent activity</p>
        <p className="text-sm">Create your first ride to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className={`p-2 rounded-full ${
            activity.type === 'ride_created' ? 'bg-green-100 text-green-600' :
            activity.type === 'booking_received' ? 'bg-blue-100 text-blue-600' :
            activity.type === 'ride_completed' ? 'bg-purple-100 text-purple-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {activity.type === 'ride_created' && <Plus className="w-4 h-4" />}
            {activity.type === 'booking_received' && <Users className="w-4 h-4" />}
            {activity.type === 'ride_completed' && <CheckCircle className="w-4 h-4" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {activity.description}
            </p>
          </div>
          
          <div className="text-xs text-gray-400">
            {formatTimeAgo(activity.timestamp)}
          </div>
        </motion.div>
      ))}
    </div>
  )
})

RecentActivity.displayName = 'RecentActivity'

const BookingRequestCard = React.memo(({ request, onRespond, isLoading }) => {
  const [responding, setResponding] = useState(false)

  const handleAccept = async () => {
    setResponding(true)
    await onRespond(request.id, 'accepted')
    setResponding(false)
  }

  const handleDecline = async () => {
    setResponding(true)
    await onRespond(request.id, 'declined')
    setResponding(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{request.passenger_name}</h4>
          <p className="text-sm text-gray-600">{request.seats_requested} seat(s) requested</p>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Pending
        </span>
      </div>
      
      <div className="mb-3 space-y-1">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {request.pickup_point}
        </div>
        {request.message && (
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
            "{request.message}"
          </p>
        )}
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={handleAccept}
          disabled={responding || isLoading}
          className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
          Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={responding || isLoading}
          className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
          Decline
        </button>
      </div>
    </motion.div>
  )
})

BookingRequestCard.displayName = 'BookingRequestCard'

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
)

const OptimizedDashboardSimple = () => {
  const { user, profile } = useAuth()
  const { 
    myRides, 
    bookingRequests,
    loading, 
    getStats, 
    respondToBookingRequest, 
    generateVerificationCode,
    getBookingRequests
  } = useRides()
  const { rideStatus, activeBooking, wsConnected } = useRealTimeRides()
  const { trackPageLoad, isLoading } = usePerformance()
  const [activeTab, setActiveTab] = useState('overview')

  // Track page load performance
  React.useEffect(() => {
    const endTracking = trackPageLoad('OptimizedDashboard')
    return endTracking
  }, [trackPageLoad])

  // Memoized calculations to prevent unnecessary recalculations
  const stats = useMemo(() => getStats(), [getStats])
  
  const currentBookingRequests = useMemo(() => getBookingRequests(), [getBookingRequests])

  const statCards = useMemo(() => [
    {
      title: 'Active Rides',
      value: myRides?.filter(ride => ride.status === 'active')?.length || 0,
      subtitle: 'Currently offering',
      icon: Car,
      color: 'from-blue-500 to-blue-600',
      change: '+2 this week'
    },
    {
      title: 'Total Bookings',
      value: stats.ridesCompleted || 0,
      subtitle: 'Completed successfully',
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      change: `+${Math.floor(stats.ridesCompleted * 0.1)} this month`
    },
    {
      title: 'Earnings',
      value: `₹${stats.totalSavings?.toLocaleString() || 0}`,
      subtitle: 'Total earned',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      change: '+15% this month'
    },
    {
      title: 'Rating',
      value: `${stats.avgRating || 0}/5`,
      subtitle: 'Average rating',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      change: '+0.2 this week'
    }
  ], [myRides, stats])

  const recentActivities = useMemo(() => {
    const activities = []
    
    // Add ride creation activities
    myRides?.slice(0, 3).forEach(ride => {
      activities.push({
        type: 'ride_created',
        title: `Created ride to ${ride.to_location}`,
        description: `From ${ride.from_location} • ${new Date(ride.departure_time).toLocaleDateString()}`,
        timestamp: ride.created_at
      })
    })
    
    // Add booking request activities
    currentBookingRequests?.slice(0, 2).forEach(request => {
      activities.push({
        type: 'booking_received',
        title: `New booking request from ${request.passenger_name}`,
        description: `${request.seats_requested} seat(s) requested`,
        timestamp: request.created_at
      })
    })
    
    // Sort by timestamp
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5)
  }, [myRides, currentBookingRequests])

  const handleBookingResponse = async (requestId, response) => {
    const verificationCode = response === 'accepted' ? generateVerificationCode() : null
    return await respondToBookingRequest(requestId, response, verificationCode)
  }

  const isPageLoading = loading && !myRides?.length

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Driver Dashboard */}
        {wsConnected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <DriverDashboard />
          </motion.div>
        )}

        {/* Header */}
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Driver'}! 👋
          </motion.h1>
          <p className="text-gray-600">Here's your ride sharing summary</p>
        </div>

        {/* Performance indicator */}
        {isLoading('dashboard') && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded-lg text-center">
            <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
            Loading dashboard data...
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: TrendingUp },
                { key: 'rides', label: 'My Rides', icon: Car },
                { key: 'requests', label: 'Booking Requests', icon: Users }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                  {key === 'requests' && currentBookingRequests?.length > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      {currentBookingRequests.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeTab === 'overview' && (
            <>
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <Suspense fallback={<LoadingSpinner />}>
                    <RecentActivity activities={recentActivities} isLoading={loading} />
                  </Suspense>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <Link
                      to="/create-ride"
                      className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      <span className="font-medium">Create New Ride</span>
                    </Link>
                    <Link
                      to="/find-rides"
                      className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Search className="w-5 h-5 mr-3" />
                      <span className="font-medium">Find Rides</span>
                    </Link>
                  </div>
                </motion.div>

                {/* Environmental Impact */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
                >
                  <div className="flex items-center mb-4">
                    <Leaf className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-semibold">Environmental Impact</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-100">CO₂ Saved</span>
                      <span className="font-bold">{stats.co2Saved}kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-100">Rides Shared</span>
                      <span className="font-bold">{stats.totalRides}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {activeTab === 'requests' && (
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Booking Requests</h2>
                
                {currentBookingRequests?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentBookingRequests.map((request) => (
                      <BookingRequestCard 
                        key={request.id} 
                        request={request} 
                        onRespond={handleBookingResponse}
                        isLoading={loading}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No booking requests</p>
                    <p className="text-sm">Requests will appear here when passengers want to book your rides.</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {activeTab === 'rides' && (
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">My Rides</h2>
                  <Link
                    to="/create-ride"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Ride
                  </Link>
                </div>
                
                {myRides?.length > 0 ? (
                  <div className="space-y-4">
                    {myRides.map((ride) => (
                      <div
                        key={ride.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {ride.from_location} → {ride.to_location}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {new Date(ride.departure_time).toLocaleDateString()} at{' '}
                                {new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            ride.status === 'active' ? 'bg-green-100 text-green-800' :
                            ride.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ride.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>₹{ride.price} • {ride.available_seats} seats available</span>
                          <span>{ride.vehicle_model}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No rides created yet</p>
                    <p className="text-sm mb-4">Start by creating your first ride to help others commute.</p>
                    <Link
                      to="/create-ride"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Ride
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default withPerformanceTracking(OptimizedDashboardSimple, 'OptimizedDashboard')