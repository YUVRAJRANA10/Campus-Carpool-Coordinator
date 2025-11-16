import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase'

const RealTimeRideContext = createContext()

export const useRealTimeRides = () => {
  const context = useContext(RealTimeRideContext)
  if (!context) {
    throw new Error('useRealTimeRides must be used within a RealTimeRideProvider')
  }
  return context
}

export const RealTimeRideProvider = ({ children }) => {
  const { user } = useAuth()
  
  // Real-time states
  const [activeBooking, setActiveBooking] = useState(null)
  const [rideStatus, setRideStatus] = useState('idle') // idle, searching, matched, ongoing, completed
  const [currentRide, setCurrentRide] = useState(null)
  const [nearbyDrivers, setNearbyDrivers] = useState([])
  const [bookingRequests, setBookingRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  // WebSocket connection simulation (replace with actual WebSocket)
  const [wsConnected, setWsConnected] = useState(false)

  // Initialize real-time subscriptions
  useEffect(() => {
    if (!user) return

    // Simulate WebSocket connection
    setWsConnected(true)
    
    // Subscribe to ride requests for drivers
    const rideRequestsSubscription = supabase
      .channel(`ride_requests_${user.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_requests',
          filter: `driver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New ride request:', payload)
          setBookingRequests(prev => [...prev, payload.new])
          addNotification(`New ride request from ${payload.new.passenger_name}!`, 'ride_request')
        }
      )
      .subscribe()

    // Subscribe to ride status updates
    const rideStatusSubscription = supabase
      .channel(`ride_status_${user.id}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'booking_requests',
          filter: `passenger_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Ride status updated:', payload)
          const status = payload.new.status
          
          if (status === 'accepted') {
            setRideStatus('matched')
            setCurrentRide(payload.new)
            addNotification(`Your ride has been accepted! Driver is on the way.`, 'ride_accepted')
          } else if (status === 'declined') {
            setRideStatus('searching')
            addNotification(`Driver declined. Finding another driver...`, 'ride_declined')
          } else if (status === 'in_progress') {
            setRideStatus('ongoing')
            addNotification(`Your ride is in progress!`, 'ride_started')
          } else if (status === 'completed') {
            setRideStatus('completed')
            addNotification(`Ride completed! Thanks for using Campus Carpool.`, 'ride_completed')
          }
        }
      )
      .subscribe()

    return () => {
      rideRequestsSubscription.unsubscribe()
      rideStatusSubscription.unsubscribe()
      setWsConnected(false)
    }
  }, [user])

  // Create ride booking request
  const requestRide = useCallback(async (bookingData) => {
    setLoading(true)
    try {
      const newBooking = {
        ...bookingData,
        passenger_id: user.id,
        passenger_name: user.user_metadata?.full_name || user.email,
        status: 'pending',
        created_at: new Date().toISOString(),
        id: Date.now() // Temporary ID
      }

      setActiveBooking(newBooking)
      setRideStatus('searching')
      
      // Simulate finding nearby drivers
      setTimeout(() => {
        setNearbyDrivers([
          {
            id: 1,
            name: 'Rajesh Kumar',
            vehicle: 'Honda City - HR01AB1234',
            rating: 4.8,
            eta: '2 mins',
            price: bookingData.estimated_fare,
            distance: '0.5 km away',
            photo: null
          },
          {
            id: 2,
            name: 'Priya Sharma',
            vehicle: 'Toyota Innova - HR02CD5678',
            rating: 4.9,
            eta: '4 mins',
            price: bookingData.estimated_fare + 20,
            distance: '1.2 km away',
            photo: null
          }
        ])
      }, 2000)

      // Auto-match with first driver after 5 seconds (simulation)
      setTimeout(() => {
        if (rideStatus === 'searching') {
          setRideStatus('matched')
          setCurrentRide({
            ...newBooking,
            driver: nearbyDrivers[0],
            status: 'accepted'
          })
          addNotification(`Driver ${nearbyDrivers[0]?.name} accepted your ride!`, 'ride_accepted')
        }
      }, 7000)

      return { success: true, booking: newBooking }
    } catch (error) {
      console.error('Error requesting ride:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [user, rideStatus, nearbyDrivers])

  // Driver accepts ride request
  const acceptRideRequest = useCallback(async (requestId) => {
    setLoading(true)
    try {
      // Update request status
      setBookingRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'accepted' }
            : req
        )
      )

      // Generate verification code
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      addNotification(`Ride request accepted! Verification code: ${verificationCode}`, 'success')
      
      return { success: true, verificationCode }
    } catch (error) {
      console.error('Error accepting ride:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Driver declines ride request
  const declineRideRequest = useCallback(async (requestId) => {
    setLoading(true)
    try {
      setBookingRequests(prev => prev.filter(req => req.id !== requestId))
      return { success: true }
    } catch (error) {
      console.error('Error declining ride:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Cancel active booking
  const cancelRide = useCallback(async () => {
    setLoading(true)
    try {
      setActiveBooking(null)
      setCurrentRide(null)
      setRideStatus('idle')
      setNearbyDrivers([])
      addNotification('Ride cancelled successfully', 'info')
      return { success: true }
    } catch (error) {
      console.error('Error cancelling ride:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Start ride (driver marks as started)
  const startRide = useCallback(async (rideId) => {
    setRideStatus('ongoing')
    if (currentRide) {
      setCurrentRide({ ...currentRide, status: 'in_progress' })
    }
    addNotification('Ride started! Enjoy your journey.', 'success')
  }, [currentRide])

  // Complete ride
  const completeRide = useCallback(async (rideId) => {
    setRideStatus('completed')
    if (currentRide) {
      setCurrentRide({ ...currentRide, status: 'completed' })
    }
    addNotification('Ride completed! Please rate your experience.', 'success')
    
    // Reset after 3 seconds
    setTimeout(() => {
      setActiveBooking(null)
      setCurrentRide(null)
      setRideStatus('idle')
    }, 3000)
  }, [currentRide])

  // Add notification
  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    }
    setNotifications(prev => [notification, ...prev])
  }, [])

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }, [])

  // Get ride estimation
  const getRideEstimation = useCallback(async (fromLocation, toLocation) => {
    // Simulate API call for price estimation
    const basePrice = 50
    const distanceMultiplier = Math.random() * 20 + 10 // 10-30 km simulation
    const estimatedFare = Math.round(basePrice + distanceMultiplier * 8)
    const estimatedTime = Math.round(distanceMultiplier * 2) // 2 mins per km
    
    return {
      estimatedFare,
      estimatedTime,
      distance: distanceMultiplier.toFixed(1) + ' km'
    }
  }, [])

  const value = {
    // States
    activeBooking,
    rideStatus,
    currentRide,
    nearbyDrivers,
    bookingRequests,
    notifications,
    loading,
    wsConnected,
    
    // Actions
    requestRide,
    acceptRideRequest,
    declineRideRequest,
    cancelRide,
    startRide,
    completeRide,
    addNotification,
    markNotificationRead,
    getRideEstimation
  }

  return (
    <RealTimeRideContext.Provider value={value}>
      {children}
    </RealTimeRideContext.Provider>
  )
}