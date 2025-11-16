import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, dbHelpers, realtimeHelpers } from '../utils/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const ProductionRideContext = createContext()

export const useRides = () => {
  const context = useContext(ProductionRideContext)
  if (!context) {
    throw new Error('useRides must be used within a ProductionRideProvider')
  }
  return context
}

export const ProductionRideProvider = ({ children }) => {
  const { user } = useAuth()
  const [rides, setRides] = useState([])
  const [myRides, setMyRides] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [bookingRequests, setBookingRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [loadingOperation, setLoadingOperation] = useState(null)
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date: '',
    seats: 1,
    priceRange: [0, 1000]
  })

  // Real-time subscriptions
  const [ridesSubscription, setRidesSubscription] = useState(null)
  const [bookingsSubscription, setBookingsSubscription] = useState(null)
  const [notificationsSubscription, setNotificationsSubscription] = useState(null)

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    return url && key && !url.includes('placeholder') && !key.includes('placeholder')
  }

  // Create ride with immediate UI update and backend sync
  const createRide = async (rideData) => {
    if (loadingOperation === 'createRide') {
      console.warn('Create ride already in progress')
      return { success: false, error: 'Operation already in progress' }
    }

    setLoadingOperation('createRide')
    setLoading(true)
    
    let tempId = null
    
    try {
      if (!user) {
        throw new Error('You must be logged in to create a ride')
      }

      if (!isSupabaseConfigured()) {
        throw new Error('Database not configured. Please set up Supabase first.')
      }

      // Create the ride object with all required fields
      const newRide = {
        title: rideData.title || `${rideData.origin_name} to ${rideData.destination_name}`,
        description: rideData.description || '',
        origin_name: rideData.origin_name,
        destination_name: rideData.destination_name,
        departure_time: rideData.departure_time,
        available_seats: parseInt(rideData.available_seats) || 1,
        price_per_seat: parseFloat(rideData.price_per_seat) || 0,
        car_model: rideData.car_model || '',
        car_color: rideData.car_color || '',
        car_license: rideData.car_license || '',
        ride_type: rideData.ride_type || 'one-way',
        preferences: rideData.preferences || '',
        origin_lat: rideData.origin_lat,
        origin_lng: rideData.origin_lng,
        destination_lat: rideData.destination_lat,
        destination_lng: rideData.destination_lng,
        driver_id: user.id
      }

      // Optimistic UI update
      tempId = 'temp_' + Date.now()
      const optimisticRide = {
        ...newRide,
        id: tempId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add driver info for UI display (not saved to DB)
        driver: {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          phone: user.user_metadata?.phone || ''
        }
      }
      
      // Add to UI immediately
      setMyRides(prev => [optimisticRide, ...prev])
      setRides(prev => [optimisticRide, ...prev])

      // Save to database
      const savedRide = await dbHelpers.createRide(newRide)
      
      if (!savedRide) {
        throw new Error('Failed to save ride to database')
      }
      
      // Replace optimistic update with real data
      setMyRides(prev => prev.map(ride => 
        ride.id === tempId ? savedRide : ride
      ))
      setRides(prev => prev.map(ride => 
        ride.id === tempId ? savedRide : ride
      ))

      addNotification('🎉 Ride created successfully!', 'success')
      return { success: true, ride: savedRide }

    } catch (error) {
      console.error('Error creating ride:', error)
      
      // Remove optimistic update on error
      if (tempId) {
        setMyRides(prev => prev.filter(ride => ride.id !== tempId))
        setRides(prev => prev.filter(ride => ride.id !== tempId))
      }
      
      // User-friendly error messages
      let errorMessage = 'Failed to create ride'
      if (error.message.includes('required')) {
        errorMessage = error.message
      } else if (error.message.includes('Database not configured')) {
        errorMessage = 'Please configure your database first'
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'A similar ride already exists'
      }
      
      addNotification(errorMessage, 'error')
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
      setLoadingOperation(null)
    }
  }

  // Real-time booking with instant driver notification
  const bookRide = async (rideId, bookingData) => {
    setLoading(true)
    try {
      if (!user) {
        throw new Error('You must be logged in to book a ride')
      }

      const ride = rides.find(r => r.id === rideId)
      if (!ride) {
        throw new Error('Ride not found')
      }

      const bookingWithUser = {
        ...bookingData,
        ride_id: rideId,
        passenger_id: user.id,
        passenger_name: user.user_metadata?.full_name || user.email.split('@')[0],
        passenger_phone: user.user_metadata?.phone || '+91-9876543214',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Production mode - save to Supabase
      const optimisticBooking = {
        id: 'temp_' + Date.now(),
        ...bookingWithUser,
        ride: ride
      }
      setMyBookings(prev => [optimisticBooking, ...prev])

      const savedBooking = await dbHelpers.createBooking(bookingWithUser)
      
      // Replace optimistic update
      setMyBookings(prev => prev.map(booking => 
        booking.id === optimisticBooking.id ? { ...savedBooking, ride } : booking
      ))

      // Notify driver instantly
      await createNotification({
        user_id: ride.driver_id,
        title: '🔔 New Booking Request!',
        message: `${bookingWithUser.passenger_name} wants to book ${bookingData.seats_requested} seat(s) for your ride`,
        type: 'booking_request',
        data: { 
          booking_id: savedBooking.id,
          ride_id: rideId,
          passenger_name: bookingWithUser.passenger_name
        }
      })

      addNotification('📋 Booking request sent to driver!', 'success')
      return savedBooking

    } catch (error) {
      console.error('Error booking ride:', error)
      
      // Remove optimistic update on error
      setMyBookings(prev => prev.filter(booking => !booking.id.toString().startsWith('temp_')))
      
      addNotification(`Failed to book ride: ${error.message}`, 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Real-time booking response with instant passenger notification
  const respondToBookingRequest = async (bookingId, response, verificationCode = null) => {
    setLoading(true)
    try {
      // Find booking request
      const booking = bookingRequests.find(b => b.id === bookingId)
      if (!booking) {
        throw new Error('Booking request not found')
      }

      const updatedStatus = response === 'accept' ? 'confirmed' : 'declined'
      
      // Production mode - update in Supabase
      const updatedBooking = await dbHelpers.updateBookingStatus(
        bookingId, 
        updatedStatus, 
        verificationCode
      )

      // Update local state
      setBookingRequests(prev => 
        prev.filter(req => req.id !== bookingId)
      )

      // Notify passenger instantly
      await createNotification({
        user_id: booking.passenger_id,
        title: response === 'accept' ? '✅ Booking Confirmed!' : '❌ Booking Declined',
        message: response === 'accept' 
          ? `Your booking has been confirmed! Verification code: ${verificationCode}`
          : `Your booking request was declined by the driver.`,
        type: response === 'accept' ? 'booking_confirmed' : 'booking_declined',
        data: { 
          booking_id: bookingId,
          verification_code: verificationCode
        }
      })

      const message = response === 'accept' 
        ? `✅ Booking confirmed and passenger notified!`
        : '❌ Booking request declined'
      addNotification(message, response === 'accept' ? 'success' : 'warning')
      
      return { success: true }

    } catch (error) {
      console.error('Error responding to booking:', error)
      addNotification(`Failed to respond to booking: ${error.message}`, 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Load all rides with proper state management
  const loadRides = async (applyFilters = true) => {
    // Prevent concurrent operations of the same type
    if (loadingOperation === 'loadRides') {
      console.log('LoadRides already in progress, skipping...')
      return { success: false, error: 'Already loading rides' }
    }

    setLoadingOperation('loadRides')
    setLoading(true)
    
    try {
      // Quick check for configuration
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured')
        setRides([])
        setIsInitialized(true)
        return { success: true, rides: [] }
      }

      // Simplified filter options
      const filterOptions = applyFilters ? {
        origin: filters.origin,
        destination: filters.destination,
        date: filters.date
      } : {}

      const fetchedRides = await dbHelpers.getRides(filterOptions)
      
      if (fetchedRides) {
        setRides(fetchedRides)
        setIsInitialized(true)
        return { success: true, rides: fetchedRides }
      } else {
        setRides([])
        return { success: false, error: 'No data returned' }
      }

    } catch (error) {
      console.error('Error loading rides:', error)
      setRides([])
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
      setLoadingOperation(null)
    }
  }

  // Load user's rides and bookings
  const loadMyRides = async () => {
    if (!user) return

    try {
      const [driverRides, passengerBookings] = await Promise.all([
        dbHelpers.getUserRides(user.id, 'driver'),
        dbHelpers.getUserRides(user.id, 'passenger')
      ])

      setMyRides(driverRides)
      setMyBookings(passengerBookings)
    } catch (error) {
      console.error('Error loading user rides:', error)
      addNotification('Failed to load your rides', 'error')
    }
  }

  // Real-time notifications
  const createNotification = async (notificationData) => {
    try {
      // Production mode - save to database
      await supabase.from('notifications').insert([{
        ...notificationData,
        created_at: new Date().toISOString(),
        is_read: false
      }])
    } catch (error) {
      console.error('Error creating notification:', error)
      // Fall back to local notification
      addNotification(notificationData.message, notificationData.type)
    }
  }

  // Local notification helper
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      is_read: false
    }
    setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50

    // Auto-remove after 5 seconds for success/error types
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, 5000)
    }
  }

  // Add booking request to driver's queue
  const addBookingRequest = (requestData) => {
    setBookingRequests(prev => [requestData, ...prev])
    
    // Show toast notification for instant driver alert
    toast.success(`New booking request from ${requestData.passenger_name}!`, {
      duration: 8000,
      icon: '🔔',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    })
  }

  // Filter rides based on current filters
  const filterRides = (allRides) => {
    return allRides.filter(ride => {
      if (filters.origin && !ride.origin_name.toLowerCase().includes(filters.origin.toLowerCase())) {
        return false
      }
      if (filters.destination && !ride.destination_name.toLowerCase().includes(filters.destination.toLowerCase())) {
        return false
      }
      if (filters.date && ride.departure_time < filters.date) {
        return false
      }
      if (filters.seats && ride.available_seats < filters.seats) {
        return false
      }
      if (ride.price_per_seat < filters.priceRange[0] || ride.price_per_seat > filters.priceRange[1]) {
        return false
      }
      return true
    })
  }

  // Update filters and refresh rides
  const updateFilters = async (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    await loadRides(true)
  }

  // Generate verification code
  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // Get booking requests for a specific ride
  const getBookingRequests = (rideId = null) => {
    if (rideId) {
      return bookingRequests.filter(req => req.ride_id === rideId)
    }
    return bookingRequests
  }

  // Get user statistics
  const getStats = () => {
    const stats = {
      totalRides: myRides.length,
      totalBookings: myBookings.length,
      ridesCompleted: myRides.filter(r => r.status === 'completed').length,
      bookingsCompleted: myBookings.filter(b => b.status === 'completed').length,
      avgRating: 4.7, // Calculate from reviews
      totalSavings: myBookings.reduce((sum, booking) => {
        const ride = booking.ride
        return sum + (ride?.price_per_seat || 0) * (booking.seats_requested || 1)
      }, 0),
      monthlyRides: myRides.length + myBookings.length,
      co2Saved: Math.round((myRides.length + myBookings.length) * 2.3), // kg CO2 saved per ride
      pendingRequests: bookingRequests.filter(r => r.status === 'pending').length
    }
    
    return stats
  }

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      )
    )
  }

  // Setup real-time subscriptions when user is authenticated
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    let isSubscribed = true

    // Subscribe to ride changes
    const ridesChannel = realtimeHelpers.subscribeToRides((payload) => {
      if (!isSubscribed) return
      console.log('Real-time ride update:', payload)
      
      if (payload.eventType === 'INSERT') {
        setRides(prev => [payload.new, ...prev])
        if (payload.new.driver_id !== user.id) {
          addNotification(`🚗 New ride available: ${payload.new.origin_name} → ${payload.new.destination_name}`)
        }
      } else if (payload.eventType === 'UPDATE') {
        setRides(prev => prev.map(ride => 
          ride.id === payload.new.id ? payload.new : ride
        ))
      } else if (payload.eventType === 'DELETE') {
        setRides(prev => prev.filter(ride => ride.id !== payload.old.id))
      }
    })

    // Subscribe to booking changes
    const bookingsChannel = realtimeHelpers.subscribeToBookings(user.id, (payload) => {
      if (!isSubscribed) return
      console.log('Real-time booking update:', payload)
      
      if (payload.eventType === 'INSERT') {
        if (payload.new.passenger_id === user.id) {
          setMyBookings(prev => [payload.new, ...prev])
        } else {
          // This is a booking request for one of my rides
          addBookingRequest(payload.new)
        }
      } else if (payload.eventType === 'UPDATE') {
        setMyBookings(prev => prev.map(booking => 
          booking.id === payload.new.id ? payload.new : booking
        ))
        setBookingRequests(prev => prev.map(request => 
          request.id === payload.new.id ? payload.new : request
        ))
      }
    })

    // Subscribe to notifications
    const notificationsChannel = realtimeHelpers.subscribeToNotifications(user.id, (payload) => {
      if (!isSubscribed) return
      console.log('Real-time notification:', payload)
      addNotification(payload.new.message, payload.new.type)
    })

    setRidesSubscription(ridesChannel)
    setBookingsSubscription(bookingsChannel)
    setNotificationsSubscription(notificationsChannel)

    // Load initial data only once per user session
    const loadInitialData = async () => {
      if (isInitialized) {
        console.log('Already initialized, skipping initial load')
        return
      }

      try {
        console.log('Loading initial data for user:', user.id)
        const result = await loadRides()
        if (result.success) {
          await loadMyRides()
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        setLoading(false)
        setLoadingOperation(null)
      }
    }

    // Load data after a short delay to ensure subscriptions are ready
    const timeoutId = setTimeout(() => {
      if (isSubscribed) {
        loadInitialData()
      }
    }, 100)

    // Cleanup subscriptions on unmount
    return () => {
      isSubscribed = false
      clearTimeout(timeoutId)
      if (ridesChannel) ridesChannel.unsubscribe()
      if (bookingsChannel) bookingsChannel.unsubscribe()
      if (notificationsChannel) notificationsChannel.unsubscribe()
    }
  }, [user]) // Only depend on user, not other state

  // Smart refresh rides every 2 minutes when tab is active
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return

    let refreshInterval
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, refresh data if it's been a while
        const lastRefresh = localStorage.getItem('lastRideRefresh')
        const now = Date.now()
        
        if (!lastRefresh || now - parseInt(lastRefresh) > 120000) { // 2 minutes
          if (!loading) {
            loadRides(false)
            localStorage.setItem('lastRideRefresh', now.toString())
          }
        }
        
        // Start interval when tab is active
        refreshInterval = setInterval(() => {
          if (!loading && document.visibilityState === 'visible') {
            loadRides(false)
            localStorage.setItem('lastRideRefresh', Date.now().toString())
          }
        }, 120000) // 2 minutes
      } else {
        // Tab hidden, clear interval
        if (refreshInterval) {
          clearInterval(refreshInterval)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Initial check
    if (document.visibilityState === 'visible') {
      handleVisibilityChange()
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [user, loading])

  const value = {
    // Data
    rides: filterRides(rides),
    myRides,
    myBookings,
    bookingRequests,
    notifications,
    loading,
    isInitialized,
    filters,
    
    // Actions
    createRide,
    bookRide,
    respondToBookingRequest,
    loadRides,
    updateFilters,
    markNotificationAsRead,
    generateVerificationCode,
    getBookingRequests,
    getStats,
    
    // Utilities
    isSupabaseConfigured,
    addNotification
  }

  return (
    <ProductionRideContext.Provider value={value}>
      {children}
    </ProductionRideContext.Provider>
  )
}