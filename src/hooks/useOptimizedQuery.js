import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase.js'

// Enterprise-level query keys for better cache management
export const queryKeys = {
  rides: ['rides'],
  userRides: (userId) => ['rides', 'user', userId],
  bookingRequests: (userId) => ['bookingRequests', userId],
  userProfile: (userId) => ['userProfile', userId],
  recentActivity: (userId) => ['recentActivity', userId]
}

// Optimized rides fetching with caching
export const useRides = (filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.rides, filters],
    queryFn: async () => {
      let query = supabase.from('rides').select('*')
      
      if (filters.departure_time) {
        query = query.gte('departure_time', filters.departure_time)
      }
      if (filters.from_location) {
        query = query.ilike('from_location', `%${filters.from_location}%`)
      }
      if (filters.to_location) {
        query = query.ilike('to_location', `%${filters.to_location}%`)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })
}

// User-specific rides with optimistic updates
export const useUserRides = (userId) => {
  return useQuery({
    queryKey: queryKeys.userRides(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000
  })
}

// Optimized booking requests
export const useBookingRequests = (userId) => {
  return useQuery({
    queryKey: queryKeys.bookingRequests(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          rides(*),
          profiles(full_name, avatar_url, email)
        `)
        .eq('driver_id', userId)
        .eq('status', 'pending')
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds for real-time feel
    refetchInterval: 60 * 1000 // Refresh every minute
  })
}

// Optimized mutations with cache updates
export const useCreateRide = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (rideData) => {
      const { data, error } = await supabase
        .from('rides')
        .insert([rideData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (newRide) => {
      // Optimistic cache updates
      queryClient.setQueryData(queryKeys.rides, (old = []) => [newRide, ...old])
      queryClient.setQueryData(queryKeys.userRides(newRide.driver_id), (old = []) => [newRide, ...old])
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.rides })
    }
  })
}

export const useBookRide = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bookingData) => {
      const { data, error } = await supabase
        .from('booking_requests')
        .insert([bookingData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate booking requests for the driver
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.bookingRequests(variables.driver_id) 
      })
    }
  })
}

export const useRespondToBooking = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ requestId, status, driverId }) => {
      const { data, error } = await supabase
        .from('booking_requests')
        .update({ status })
        .eq('id', requestId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Update cache immediately
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.bookingRequests(variables.driverId) 
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity(variables.driverId) })
    }
  })
}