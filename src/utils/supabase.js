import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.log('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 5 // Reduce for better performance
      }
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-my-custom-header': 'campus-carpool'
      }
    }
  }
)

// Test Supabase connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('rides').select('count').limit(1)
    if (error) throw error
    return { success: true, message: 'Connection successful' }
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return { success: false, error: error.message }
  }
}

// Helper functions for common operations
export const authHelpers = {
  // Sign up with email validation
  async signUp(email, password, userData) {
    if (!email.endsWith('@chitkara.edu.in')) {
      throw new Error('Please use your Chitkara University email (@chitkara.edu.in)')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          phone: userData.phone,
          student_id: userData.studentId,
          university_year: userData.year,
          department: userData.department
        }
      }
    })

    if (error) throw error
    return data
  },

  // Sign in
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get user profile
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  // Update user profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Create user profile
  async createProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Database helpers
export const dbHelpers = {
  // Rides
  async createRide(rideData) {
    try {
      // Create minimal ride object with only essential columns
      const ride = {
        origin_name: String(rideData.origin_name || '').trim(),
        destination_name: String(rideData.destination_name || '').trim(),
        departure_time: new Date(rideData.departure_time).toISOString(),
        available_seats: Math.max(1, parseInt(rideData.available_seats) || 1),
        price_per_seat: Math.max(0, parseFloat(rideData.price_per_seat) || 0),
        driver_id: rideData.driver_id,
        status: 'active'
      }

      // Add optional columns only if they exist in the schema
      if (rideData.title) ride.title = String(rideData.title).trim()
      if (rideData.description) ride.description = String(rideData.description).trim()
      if (rideData.car_model) ride.car_model = String(rideData.car_model).trim()
      if (rideData.car_color) ride.car_color = String(rideData.car_color).trim()
      if (rideData.car_license) ride.car_license = String(rideData.car_license).trim()
      if (rideData.ride_type) ride.ride_type = rideData.ride_type
      if (rideData.preferences) ride.preferences = String(rideData.preferences).trim()

      // Add coordinates if provided
      if (rideData.origin_lat) ride.origin_lat = parseFloat(rideData.origin_lat)
      if (rideData.origin_lng) ride.origin_lng = parseFloat(rideData.origin_lng)
      if (rideData.destination_lat) ride.destination_lat = parseFloat(rideData.destination_lat)
      if (rideData.destination_lng) ride.destination_lng = parseFloat(rideData.destination_lng)

      // Validate required fields
      if (!ride.origin_name || !ride.destination_name) {
        throw new Error('Origin and destination are required')
      }
      if (!ride.driver_id) {
        throw new Error('Driver ID is required')
      }

      console.log('Creating ride with minimal data:', ride)

      const { data, error } = await supabase
        .from('rides')
        .insert(ride)
        .select('*')
        .single()

      if (error) {
        console.error('Supabase createRide error:', error)
        throw new Error(`Failed to create ride: ${error.message}`)
      }
      
      console.log('Ride created successfully:', data)
      return data
    } catch (error) {
      console.error('Error in createRide:', error)
      throw error
    }
  },

  async getRides(filters = {}) {
    try {
      // Simple, clean query without complex selects
      let query = supabase
        .from('rides')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20) // Limit for performance

      // Apply basic filters only
      if (filters.origin) {
        query = query.ilike('origin_name', `%${filters.origin}%`)
      }
      if (filters.destination) {
        query = query.ilike('destination_name', `%${filters.destination}%`)
      }
      if (filters.date) {
        const filterDate = new Date(filters.date).toISOString().split('T')[0]
        query = query.gte('departure_time', filterDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase getRides error:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error in getRides:', error)
      return []
    }
  },

  async getUserRides(userId, type = 'driver') {
    try {
      let query
      
      if (type === 'driver') {
        query = supabase
          .from('rides')
          .select('*')
          .eq('driver_id', userId)
      } else {
        query = supabase
          .from('bookings')
          .select('*, ride_id')
          .eq('passenger_id', userId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error(`Supabase getUserRides error for ${type}:`, error)
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error('Error in getUserRides:', error)
      return []
    }
  },

  // Bookings
  async createBooking(bookingData) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateBookingStatus(bookingId, status, verificationCode = null) {
    const updates = { 
      status, 
      updated_at: new Date().toISOString() 
    }
    
    if (verificationCode) {
      updates.verification_code = verificationCode
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateBooking(bookingId, updates) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Notifications
  async getUserNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async markNotificationAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Reviews
  async createReview(reviewData) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserReviews(userId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

// Real-time subscriptions
export const realtimeHelpers = {
  subscribeToRides(callback) {
    try {
      return supabase
        .channel('public:rides')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'rides' 
          },
          (payload) => {
            console.log('Real-time rides update:', payload)
            callback(payload)
          }
        )
        .subscribe((status) => {
          console.log('Rides subscription status:', status)
        })
    } catch (error) {
      console.error('Error setting up rides subscription:', error)
      return null
    }
  },

  subscribeToBookings(userId, callback) {
    try {
      return supabase
        .channel(`public:bookings:${userId}`)
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'bookings'
          },
          (payload) => {
            console.log('Real-time bookings update:', payload)
            callback(payload)
          }
        )
        .subscribe((status) => {
          console.log('Bookings subscription status:', status)
        })
    } catch (error) {
      console.error('Error setting up bookings subscription:', error)
      return null
    }
  },

  subscribeToNotifications(userId, callback) {
    try {
      return supabase
        .channel(`public:notifications:${userId}`)
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Real-time notification:', payload)
            callback(payload)
          }
        )
        .subscribe((status) => {
          console.log('Notifications subscription status:', status)
        })
    } catch (error) {
      console.error('Error setting up notifications subscription:', error)
      return null
    }
  }
}