import React, { createContext, useContext, useMemo, useCallback } from 'react'
import { 
  useRides, 
  useUserRides, 
  useBookingRequests, 
  useCreateRide, 
  useBookRide, 
  useRespondToBooking 
} from '../hooks/useOptimizedQuery.js'
import { useAuth } from './AuthContext.jsx'
import { usePerformance } from './PerformanceContext.jsx'

const RideContext = createContext()

export const useRidesContext = () => {
  const context = useContext(RideContext)
  if (!context) {
    throw new Error('useRidesContext must be used within a RideProvider')
  }
  return context
}

export const RideProvider = React.memo(({ children }) => {
  const { user } = useAuth()
  const { setLoading, debouncedSearch } = usePerformance()
  
  // Optimized state management
  const [filters, setFilters] = React.useState({
    origin: '',
    destination: '',
    date: '',
    seats: 1,
    priceRange: [0, 100]
  })
  
  const [notifications, setNotifications] = React.useState([])

  // React Query hooks - enterprise-level caching
  const { 
    data: rides = [], 
    isLoading: ridesLoading,
    error: ridesError
  } = useRides(filters)
  
  const { 
    data: myRides = [], 
    isLoading: myRidesLoading 
  } = useUserRides(user?.id)
  
  const { 
    data: bookingRequests = [], 
    isLoading: bookingRequestsLoading 
  } = useBookingRequests(user?.id)

  // Optimized mutations
  const createRideMutation = useCreateRide()
  const bookRideMutation = useBookRide()
  const respondToBookingMutation = useRespondToBooking()

  // Memoized calculations - prevent unnecessary recalculations
  const stats = useMemo(() => {
    if (!user) return { totalRides: 0, ridesCompleted: 0, avgRating: 0, totalSavings: 0, monthlyRides: 0, co2Saved: 0 }
    
    return {
      totalRides: myRides.length,
      ridesCompleted: myRides.filter(r => r.status === 'completed').length,
      avgRating: 4.7, // Calculate from reviews
      totalSavings: myRides.reduce((sum, ride) => sum + (ride.price * ride.available_seats), 0),
      monthlyRides: myRides.filter(ride => {
        const rideDate = new Date(ride.departure_time)
        const now = new Date()
        return rideDate.getMonth() === now.getMonth() && rideDate.getFullYear() === now.getFullYear()
      }).length,
      co2Saved: Math.round(myRides.length * 2.3) // Approximate kg CO2 saved per ride
    }
  }, [myRides, user])

  // Optimized functions with useCallback
  const createRide = useCallback(async (rideData) => {
    setLoading('createRide', true)
    try {
      const enrichedData = {
        ...rideData,
        driver_id: user?.id,
        driver_name: user?.user_metadata?.full_name || user?.email,
        driver_phone: user?.user_metadata?.phone || '',
        status: 'active',
        created_at: new Date().toISOString()
      }
      
      const result = await createRideMutation.mutateAsync(enrichedData)
      addNotification('Ride created successfully!', 'success')
      return { success: true, ride: result }
    } catch (error) {
      console.error('Error creating ride:', error)
      addNotification('Failed to create ride. Please try again.', 'error')
      return { success: false, error: error.message }
    } finally {
      setLoading('createRide', false)
    }
  }, [user, createRideMutation, setLoading])

  const bookRide = useCallback(async (rideId, bookingData) => {
    setLoading('bookRide', true)
    try {
      const enrichedData = {
        ...bookingData,
        ride_id: rideId,
        passenger_id: user?.id,
        passenger_name: user?.user_metadata?.full_name || user?.email,
        passenger_phone: user?.user_metadata?.phone || '',
        status: 'pending',
        created_at: new Date().toISOString()
      }
      
      const result = await bookRideMutation.mutateAsync(enrichedData)
      addNotification('Booking request sent successfully!', 'success')
      return { success: true, booking: result }
    } catch (error) {
      console.error('Error booking ride:', error)
      addNotification('Failed to book ride. Please try again.', 'error')
      return { success: false, error: error.message }
    } finally {
      setLoading('bookRide', false)
    }
  }, [user, bookRideMutation, setLoading])

  const respondToBookingRequest = useCallback(async (requestId, response, verificationCode = null) => {
    setLoading('respondToBooking', true)
    try {
      await respondToBookingMutation.mutateAsync({
        requestId,
        status: response,
        driverId: user?.id
      })
      
      const message = response === 'accepted' 
        ? `Booking request accepted! Verification code: ${verificationCode || generateVerificationCode()}`
        : 'Booking request declined.'
      addNotification(message, 'success')
      
      return { success: true }
    } catch (error) {
      console.error('Error responding to booking request:', error)
      addNotification('Failed to respond to booking request.', 'error')
      return { success: false, error: error.message }
    } finally {
      setLoading('respondToBooking', false)
    }
  }, [user, respondToBookingMutation, setLoading])

  // Optimized search function
  const updateFilters = useCallback(debouncedSearch((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, 300), [debouncedSearch])

  const addNotification = useCallback((message, type = 'success') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    }
    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep max 50 notifications
  }, [])

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }, [])

  const getNearbyRides = useCallback((userLat, userLng, radius = 10) => {
    if (!rides.length) return []
    
    return rides.filter(ride => {
      if (!ride.origin_lat || !ride.origin_lng) return false
      
      const distance = Math.sqrt(
        Math.pow(ride.origin_lat - userLat, 2) + 
        Math.pow(ride.origin_lng - userLng, 2)
      )
      return distance <= radius / 111 // Rough conversion to degrees
    })
  }, [rides])

  const generateVerificationCode = useCallback(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }, [])

  const getBookingRequests = useCallback((rideId = null) => {
    if (rideId) {
      return bookingRequests.filter(req => req.ride_id === rideId)
    }
    return bookingRequests
  }, [bookingRequests])

  const isSupabaseConfigured = useCallback(() => {
    return false // Demo mode
  }, [])

  // Loading state aggregation
  const loading = ridesLoading || myRidesLoading || bookingRequestsLoading || 
                 createRideMutation.isPending || bookRideMutation.isPending || 
                 respondToBookingMutation.isPending

  // Memoized context value - critical for preventing unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Data
    rides,
    myRides,
    myBookings: [], // This would come from a separate query in real implementation
    notifications,
    bookingRequests,
    stats,
    filters,
    
    // Loading states
    loading,
    ridesError,
    
    // Actions
    createRide,
    bookRide,
    cancelBooking: async () => ({ success: true }), // Implement with mutation
    updateFilters,
    markNotificationAsRead,
    respondToBookingRequest,
    getNearbyRides,
    generateVerificationCode,
    getBookingRequests,
    isSupabaseConfigured,
    
    // Mutations for direct access
    createRideMutation,
    bookRideMutation,
    respondToBookingMutation
  }), [
    rides, myRides, notifications, bookingRequests, stats, filters, loading, ridesError,
    createRide, bookRide, updateFilters, markNotificationAsRead, respondToBookingRequest,
    getNearbyRides, generateVerificationCode, getBookingRequests, isSupabaseConfigured,
    createRideMutation, bookRideMutation, respondToBookingMutation
  ])

  return (
    <RideContext.Provider value={contextValue}>
      {children}
    </RideContext.Provider>
  )
})

RideProvider.displayName = 'RideProvider'