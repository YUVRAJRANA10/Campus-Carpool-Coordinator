import React, { createContext, useContext, useState, useEffect } from 'react'

const RideContext = createContext()

export const useRides = () => {
  const context = useContext(RideContext)
  if (!context) {
    throw new Error('useRides must be used within a RideProvider')
  }
  return context
}

export const RideProvider = ({ children }) => {
  const [rides, setRides] = useState([])
  const [myRides, setMyRides] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date: '',
    seats: 1,
    priceRange: [0, 100]
  })

  // Check if Supabase is configured
  const isSupabaseConfigured = () => {
    return false // Set to false for demo mode
  }

  // No sample rides - only show real user-created rides
  // No sample stats - calculate real stats from user data

  // Sample booking requests
  const [bookingRequests, setBookingRequests] = useState([
    {
      id: 1,
      ride_id: 1,
      passenger_name: 'Alice Johnson',
      passenger_phone: '+91-9876543212',
      seats_requested: 2,
      pickup_point: 'Main Gate',
      message: 'Hi, I need a ride to Academic Block A for my morning class.',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ])

  const createRide = async (rideData) => {
    setLoading(true)
    try {
      const newRide = {
        id: Date.now(),
        ...rideData,
        driver_id: 'current_user',
        driver_name: 'Current User',
        driver_phone: '+91-9876543213',
        status: 'active',
        created_at: new Date().toISOString()
      }
      
      setMyRides(prev => [...prev, newRide])
      setRides(prev => [...prev, newRide])
      
      return { success: true, ride: newRide }
    } catch (error) {
      console.error('Error creating ride:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const bookRide = async (rideId, bookingData) => {
    setLoading(true)
    try {
      const newBooking = {
        id: Date.now(),
        ride_id: rideId,
        passenger_id: 'current_user',
        passenger_name: 'Current User',
        passenger_phone: '+91-9876543214',
        ...bookingData,
        status: 'pending',
        created_at: new Date().toISOString()
      }
      
      setMyBookings(prev => [...prev, newBooking])
      
      // Add notification
      addNotification('Booking request sent successfully!')
      
      return { success: true, booking: newBooking }
    } catch (error) {
      console.error('Error booking ride:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId) => {
    setLoading(true)
    try {
      setMyBookings(prev => prev.filter(booking => booking.id !== bookingId))
      addNotification('Booking cancelled successfully!')
      return { success: true }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const loadRides = async () => {
    setLoading(true)
    try {
      // In a real app, this would fetch from Supabase
      // For now, just return the rides already in state (user-created rides)
      return { success: true, rides: rides }
    } catch (error) {
      console.error('Error loading rides:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const addNotification = (message, type = 'success') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    }
    setNotifications(prev => [notification, ...prev])
  }

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  const getStats = () => {
    const stats = {
      totalRides: myRides.length,
      ridesCompleted: myRides.filter(r => r.status === 'completed').length + 
                     myBookings.filter(b => b.status === 'completed').length,
      avgRating: 4.7, // Calculate from reviews
      totalSavings: myBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0),
      monthlyRides: myRides.length + myBookings.length,
      co2Saved: Math.round((myRides.length + myBookings.length) * 2.3) // Approximate kg CO2 saved per ride
    }
    
    return stats
  }

  const getNearbyRides = (userLat, userLng, radius = 10) => {
    // Simple distance calculation for demo
    return rides.filter(ride => {
      const distance = Math.sqrt(
        Math.pow(ride.origin_lat - userLat, 2) + 
        Math.pow(ride.origin_lng - userLng, 2)
      )
      return distance <= radius / 111 // Rough conversion to degrees
    })
  }

  // New booking system functions
  const respondToBookingRequest = async (requestId, response, verificationCode = null) => {
    setLoading(true)
    try {
      setBookingRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: response, verification_code: verificationCode }
            : req
        )
      )
      
      const message = response === 'accepted' 
        ? `Booking request accepted! Verification code: ${verificationCode}`
        : 'Booking request declined.'
      addNotification(message)
      
      return { success: true }
    } catch (error) {
      console.error('Error responding to booking request:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const getBookingRequests = (rideId = null) => {
    if (rideId) {
      return bookingRequests.filter(req => req.ride_id === rideId)
    }
    return bookingRequests
  }

  // Load initial data
  useEffect(() => {
    loadRides()
  }, [])

  const value = {
    rides,
    myRides,
    myBookings,
    notifications,
    loading,
    filters,
    createRide,
    bookRide,
    cancelBooking,
    updateFilters,
    loadRides,
    markNotificationAsRead,
    getStats,
    getNearbyRides,
    isSupabaseConfigured,
    // New booking system functions
    respondToBookingRequest,
    generateVerificationCode,
    getBookingRequests,
    // Enhanced features
    bookingRequests
  }

  return (
    <RideContext.Provider value={value}>
      {children}
    </RideContext.Provider>
  )
}