import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRides } from '../contexts/ProductionRideContext'
import Navbar from '../components/Navbar'
import DriverRequestPanel from '../components/DriverRequestPanel'
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
  ArrowUpRight
} from 'lucide-react'

const Dashboard = () => {
  const { user, profile, isSupabaseConfigured } = useAuth()
  const { 
    myRides, 
    myBookings, 
    loading, 
    getStats, 
    getBookingRequests, 
    respondToBookingRequest, 
    generateVerificationCode 
  } = useRides()
  const [activeTab, setActiveTab] = useState('overview')

  const stats = getStats()
  const bookingRequests = getBookingRequests()

  const statCards = [
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
      value: myBookings?.length || 0,
      subtitle: 'Rides booked',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      change: '+3 this month'
    },
    {
      title: 'Money Saved',
      value: `₹${stats.totalSavings || 1250}`,
      subtitle: 'This semester',
      icon: DollarSign,
      color: 'from-cu-red to-cu-orange',
      change: '+₹340 this month'
    },
    {
      title: 'Your Rating',
      value: profile?.rating || '4.8',
      subtitle: `${stats.ridesCompleted || 15} completed trips`,
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      change: '+0.2 this month'
    },
    {
      title: 'CO₂ Saved',
      value: `${stats.co2Saved || 234}kg`,
      subtitle: 'Environmental impact',
      icon: Leaf,
      color: 'from-emerald-500 to-emerald-600',
      change: '+45kg this month'
    },
    {
      title: 'Community Rank',
      value: '#12',
      subtitle: 'Top contributor',
      icon: Award,
      color: 'from-purple-500 to-purple-600',
      change: '↑5 positions'
    }
  ]

  const quickActions = [
    {
      title: 'Create New Ride',
      description: 'Share your journey with fellow students',
      icon: Plus,
      color: 'bg-cu-red',
      link: '/rides/create'
    },
    {
      title: 'Find Rides',
      description: 'Discover available rides to your destination',
      icon: Search,
      color: 'bg-blue-500',
      link: '/rides/find'
    },
    {
      title: 'My Bookings',
      description: 'View and manage your ride bookings',
      icon: Calendar,
      color: 'bg-green-500',
      link: '#',
      onClick: () => setActiveTab('bookings')
    }
  ]

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  // Generate real recent activity based on user's actual data
  const generateRecentActivity = () => {
    const activities = []
    
    // Add recent booking requests
    bookingRequests.slice(-5).forEach(request => {
      if (request.status === 'pending') {
        activities.push({
          id: `booking-${request.id}`,
          type: 'booking',
          title: 'New booking request',
          description: `${request.passenger_name} requested ${request.seats_requested} seat(s) for ${request.pickup_point}`,
          time: formatTimeAgo(request.created_at),
          icon: Users,
          color: 'text-orange-600'
        })
      } else if (request.status === 'accepted') {
        activities.push({
          id: `booking-accepted-${request.id}`,
          type: 'accepted',
          title: 'Booking request accepted',
          description: `Accepted booking request from ${request.passenger_name}`,
          time: formatTimeAgo(request.created_at),
          icon: CheckCircle,
          color: 'text-green-600'
        })
      }
    })
    
    // Add recent rides created
    myRides.slice(-3).forEach(ride => {
      activities.push({
        id: `ride-${ride.id}`,
        type: 'ride-created',
        title: 'Ride created',
        description: `Created ride from ${ride.origin} to ${ride.destination}`,
        time: formatTimeAgo(ride.created_at || new Date().toISOString()),
        icon: Car,
        color: 'text-blue-600'
      })
    })
    
    // Add recent bookings made
    myBookings.slice(-3).forEach(booking => {
      activities.push({
        id: `my-booking-${booking.id}`,
        type: 'booking-made',
        title: 'Booking made',
        description: `Booked ${booking.seats_requested || 1} seat(s) for ride`,
        time: formatTimeAgo(booking.created_at || new Date().toISOString()),
        icon: Calendar,
        color: 'text-purple-600'
      })
    })
    
    // Sort by time (most recent first) and limit to 5
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5)
  }
  
  const recentActivity = generateRecentActivity()

  const upcomingRides = myRides?.filter(ride => 
    new Date(ride.departure_time) > new Date() && ride.status === 'active'
  ).slice(0, 3) || []

  const upcomingBookings = myBookings?.filter(booking => 
    new Date(booking.ride?.departure_time) > new Date() && booking.status === 'confirmed'
  ).slice(0, 3) || []

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Car },
    { id: 'rides', name: 'My Rides', icon: Car },
    { id: 'bookings', name: 'My Bookings', icon: Calendar },
    { id: 'requests', name: `Requests (${bookingRequests.filter(r => r.status === 'pending').length})`, icon: Users }
  ]

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="page-container py-20">
          <div className="flex items-center justify-center">
            <div className="glass-card p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cu-red mx-auto mb-4"></div>
              <p className="text-slate-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="page-container py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="glass-card p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  Welcome back, {profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Student'}! 👋
                </h1>
                <p className="text-slate-600">
                  Here's your personal dashboard with rides, bookings, and stats
                  {!isSupabaseConfigured() && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Demo Mode
                    </span>
                  )}
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  to="/rides/create"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Create Ride</span>
                </Link>
                <Link
                  to="/rides/find"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Search size={18} />
                  <span>Find Rides</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-card p-6 hover:scale-105 transition-transform duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-600">{stat.title}</h3>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{stat.subtitle}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp size={14} className="text-green-500 mr-1" />
                      <span className="text-sm text-green-600">{stat.change}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Tab Navigation */}
        <div className="glass-card mb-8">
          <div className="flex border-b border-white/20">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-cu-red border-b-2 border-cu-red'
                      : 'text-slate-600 hover:text-cu-red'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon
                      const Element = action.onClick ? 'button' : Link
                      const props = action.onClick 
                        ? { onClick: action.onClick }
                        : { to: action.link }
                      
                      return (
                        <Element
                          key={action.title}
                          {...props}
                          className="glass-card p-4 hover:scale-105 transition-all duration-200 group text-left w-full"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                              <Icon size={20} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800 group-hover:text-cu-red transition-colors">
                                {action.title}
                              </h4>
                              <p className="text-sm text-slate-600">{action.description}</p>
                            </div>
                            <ArrowUpRight size={16} className="text-slate-400 group-hover:text-cu-red transition-colors" />
                          </div>
                        </Element>
                      )
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => {
                        const Icon = activity.icon
                        return (
                          <div key={activity.id} className="flex items-start space-x-4 p-4 bg-white/30 rounded-lg">
                            <div className={`p-2 rounded-full bg-white/50 ${activity.color}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800">{activity.title}</h4>
                            <p className="text-sm text-slate-600">{activity.description}</p>
                            <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      )
                    })
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Clock size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No recent activity yet</p>
                        <p className="text-sm">Start by creating a ride or booking one to see activity here!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upcoming Rides */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Upcoming Rides</h3>
                    {upcomingRides.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingRides.map((ride) => (
                          <div key={ride.id} className="p-4 bg-white/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-slate-800">{ride.title}</h4>
                                <p className="text-sm text-slate-600">
                                  {ride.origin_name} → {ride.destination_name}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                                  <span className="flex items-center space-x-1">
                                    <Clock size={14} />
                                    <span>{formatDate(ride.departure_time)}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Users size={14} />
                                    <span>{ride.available_seats} seats left</span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-cu-red">₹{ride.price_per_seat}</p>
                                <p className="text-sm text-slate-500">per seat</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link
                          to="/rides"
                          className="block text-center text-cu-red hover:text-cu-red/80 font-medium text-sm"
                        >
                          View All Rides
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Car size={32} className="mx-auto mb-3 opacity-50" />
                        <p>No upcoming rides</p>
                        <Link to="/rides/create" className="text-cu-red hover:underline">
                          Create your first ride
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Upcoming Bookings */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Upcoming Bookings</h3>
                    {upcomingBookings.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingBookings.map((booking) => (
                          <div key={booking.id} className="p-4 bg-white/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-slate-800">
                                  {booking.ride?.title || 'Booked Ride'}
                                </h4>
                                <p className="text-sm text-slate-600">
                                  Driver: {booking.ride?.driver?.full_name}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                                  <span className="flex items-center space-x-1">
                                    <Clock size={14} />
                                    <span>{formatDate(booking.ride?.departure_time)}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Users size={14} />
                                    <span>{booking.seats_booked} seats booked</span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-green-600">₹{booking.total_amount}</p>
                                <p className="text-sm text-slate-500">paid</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link
                          to="/bookings"
                          className="block text-center text-cu-red hover:text-cu-red/80 font-medium text-sm"
                        >
                          View All Bookings
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Calendar size={32} className="mx-auto mb-3 opacity-50" />
                        <p>No upcoming bookings</p>
                        <Link to="/rides/find" className="text-cu-red hover:underline">
                          Find rides to book
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rides' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">My Rides</h3>
                  <Link to="/rides/create" className="btn-primary">
                    Create New Ride
                  </Link>
                </div>
                {/* Rides list content would go here */}
                <div className="text-center py-8 text-slate-500">
                  <Car size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Your created rides will appear here</p>
                  <Link to="/rides/create" className="btn-secondary">
                    Create Your First Ride
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">My Bookings</h3>
                  <Link to="/rides/find" className="btn-primary">
                    Book New Ride
                  </Link>
                </div>
                {/* Bookings list content would go here */}
                <div className="text-center py-8 text-slate-500">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Your booked rides will appear here</p>
                  <Link to="/rides/find" className="btn-secondary">
                    Find Rides to Book
                  </Link>
                </div>
              </div>
            )}
            {activeTab === 'requests' && (
              <div>
                <DriverRequestPanel
                  bookingRequests={bookingRequests}
                  onAccept={(requestId, code) => respondToBookingRequest(requestId, 'accept', code)}
                  onDecline={(requestId) => respondToBookingRequest(requestId, 'decline')}
                  onGenerateCode={generateVerificationCode}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard