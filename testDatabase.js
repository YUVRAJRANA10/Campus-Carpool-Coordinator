// Test database connection and create sample rides
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hckctplthsacawpkbwhc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhja2N0cGx0aHNhY2F3cGtid2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0ODk3NTMsImV4cCI6MjA0NzA2NTc1M30.4g50VzfYhvXUXBQqnmWXwVYZOi8g3S0w85QHUlzBkwY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test basic connection
    const { data: users, error: usersError } = await supabase.auth.getUser()
    console.log('Current user:', users?.user?.email || 'Not logged in')
    
    // Check rides table
    const { data: rides, error: ridesError } = await supabase
      .from('rides')
      .select('*')
      .limit(5)
    
    console.log('📊 Rides in database:', rides?.length || 0)
    console.log('Rides error:', ridesError)
    
    if (rides && rides.length > 0) {
      console.log('Sample ride:', rides[0])
    }
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    console.log('👥 Profiles in database:', profiles?.length || 0)
    console.log('Profiles error:', profilesError)
    
    if (profiles && profiles.length > 0) {
      console.log('Sample profile:', profiles[0])
    }
    
    // Test the specific query that's failing
    const { data: ridesWithProfiles, error: joinError } = await supabase
      .from('rides')
      .select(`
        *,
        driver:profiles(
          id,
          full_name,
          email,
          phone,
          department,
          role,
          rating,
          total_rides
        )
      `)
      .eq('status', 'active')
      .limit(5)
    
    console.log('🔗 Rides with profiles:', ridesWithProfiles?.length || 0)
    console.log('Join error:', joinError)
    
    if (ridesWithProfiles && ridesWithProfiles.length > 0) {
      console.log('Sample ride with profile:', ridesWithProfiles[0])
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  }
}

// If running in browser
if (typeof window !== 'undefined') {
  window.testDatabase = testDatabase
  console.log('🧪 Run testDatabase() in browser console to test')
}

export default testDatabase