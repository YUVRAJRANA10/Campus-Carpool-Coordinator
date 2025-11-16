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
        eventsPerSecond: 10
      }
    }
  }
)

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
    const { data, error } = await supabase
      .from('rides')
      .insert([rideData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getRides(filters = {}) {
    let query = supabase
      .from('rides')
      .select(`
        *,
        driver:profiles!rides_driver_id_fkey(*)
      `)
      .eq('status', 'active')

    // Apply filters
    if (filters.origin) {
      query = query.ilike('origin_name', `%${filters.origin}%`)
    }
    if (filters.destination) {
      query = query.ilike('destination_name', `%${filters.destination}%`)
    }
    if (filters.date) {
      query = query.gte('departure_time', filters.date)
    }

    const { data, error } = await query.order('departure_time', { ascending: true })

    if (error) throw error
    return data
  },

  async getUserRides(userId, type = 'driver') {
    const column = type === 'driver' ? 'driver_id' : 'passenger_id'
    let query

    if (type === 'driver') {
      query = supabase
        .from('rides')
        .select('*')
        .eq('driver_id', userId)
    } else {
      query = supabase
        .from('bookings')
        .select(`
          *,
          ride:rides(*, driver:profiles!rides_driver_id_fkey(*))
        `)
        .eq('passenger_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
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
    return supabase
      .channel('rides_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rides' },
        callback
      )
      .subscribe()
  },

  subscribeToBookings(userId, callback) {
    return supabase
      .channel(`bookings_${userId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `passenger_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  },

  subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}