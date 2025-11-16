// Database setup and table creation for Campus Carpool Coordinator
import { supabase } from './supabase.js'

export const createTables = async () => {
  const tables = [
    {
      name: 'profiles',
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          full_name TEXT,
          email TEXT UNIQUE,
          phone TEXT,
          student_id TEXT,
          department TEXT,
          role TEXT DEFAULT 'student',
          university_year INTEGER,
          rating DECIMAL(3,2) DEFAULT 5.0,
          total_rides INTEGER DEFAULT 0,
          bio TEXT,
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `
    },
    {
      name: 'rides',
      sql: `
        CREATE TABLE IF NOT EXISTS rides (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          origin_name TEXT NOT NULL,
          destination_name TEXT NOT NULL,
          departure_time TIMESTAMPTZ NOT NULL,
          available_seats INTEGER NOT NULL DEFAULT 1,
          price_per_seat DECIMAL(10,2) NOT NULL DEFAULT 0,
          car_model TEXT,
          car_color TEXT,
          car_license TEXT,
          ride_type TEXT DEFAULT 'one-way',
          preferences TEXT,
          origin_lat DECIMAL(10,8),
          origin_lng DECIMAL(11,8),
          destination_lat DECIMAL(10,8),
          destination_lng DECIMAL(11,8),
          status TEXT DEFAULT 'active',
          driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          driver_name TEXT,
          driver_phone TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `
    },
    {
      name: 'bookings',
      sql: `
        CREATE TABLE IF NOT EXISTS bookings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
          passenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          passenger_name TEXT,
          passenger_phone TEXT,
          seats_requested INTEGER NOT NULL DEFAULT 1,
          pickup_location TEXT,
          status TEXT DEFAULT 'pending',
          message TEXT,
          verification_code TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `
    },
    {
      name: 'notifications',
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          data JSONB,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `
    },
    {
      name: 'reviews',
      sql: `
        CREATE TABLE IF NOT EXISTS reviews (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
          reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          type TEXT DEFAULT 'ride', -- 'ride' or 'driver' or 'passenger'
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `
    }
  ]

  const results = []
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.rpc('create_table_sql', {
        sql_query: table.sql
      })
      
      if (error) {
        console.log(`Table ${table.name} might already exist or need manual creation`)
        console.log('SQL for manual creation:')
        console.log(table.sql)
      }
      
      results.push({
        table: table.name,
        success: !error,
        error: error?.message
      })
    } catch (err) {
      console.error(`Error creating table ${table.name}:`, err)
      results.push({
        table: table.name,
        success: false,
        error: err.message
      })
    }
  }
  
  return results
}

export const testTableAccess = async () => {
  const tables = ['profiles', 'rides', 'bookings', 'notifications', 'reviews']
  const results = []
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      results.push({
        table: tableName,
        accessible: !error,
        error: error?.message,
        hasData: data && data.length > 0
      })
    } catch (err) {
      results.push({
        table: tableName,
        accessible: false,
        error: err.message,
        hasData: false
      })
    }
  }
  
  return results
}

export const setupRLS = async () => {
  // Row Level Security policies
  const policies = [
    {
      table: 'profiles',
      sql: `
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view all profiles" ON profiles
          FOR SELECT USING (true);
        
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Users can insert own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
      `
    },
    {
      table: 'rides',
      sql: `
        ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can view active rides" ON rides
          FOR SELECT USING (status = 'active');
        
        CREATE POLICY "Drivers can manage own rides" ON rides
          FOR ALL USING (auth.uid() = driver_id);
      `
    },
    {
      table: 'bookings',
      sql: `
        ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own bookings" ON bookings
          FOR SELECT USING (auth.uid() = passenger_id OR auth.uid() IN (
            SELECT driver_id FROM rides WHERE rides.id = bookings.ride_id
          ));
        
        CREATE POLICY "Users can create bookings" ON bookings
          FOR INSERT WITH CHECK (auth.uid() = passenger_id);
        
        CREATE POLICY "Drivers can update booking status" ON bookings
          FOR UPDATE USING (auth.uid() IN (
            SELECT driver_id FROM rides WHERE rides.id = bookings.ride_id
          ));
      `
    },
    {
      table: 'notifications',
      sql: `
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own notifications" ON notifications
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own notifications" ON notifications
          FOR UPDATE USING (auth.uid() = user_id);
      `
    }
  ]
  
  const results = []
  
  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: policy.sql
      })
      
      results.push({
        table: policy.table,
        success: !error,
        error: error?.message
      })
    } catch (err) {
      results.push({
        table: policy.table,
        success: false,
        error: err.message
      })
    }
  }
  
  return results
}

// Quick database health check
export const healthCheck = async () => {
  try {
    const [tableResults, connectionTest] = await Promise.all([
      testTableAccess(),
      supabase.from('rides').select('count').limit(1)
    ])
    
    return {
      connected: !connectionTest.error,
      tables: tableResults,
      error: connectionTest.error?.message
    }
  } catch (error) {
    return {
      connected: false,
      tables: [],
      error: error.message
    }
  }
}

// Manual SQL for Supabase dashboard
export const getManualSetupSQL = () => {
  return `
-- Run this SQL in your Supabase SQL Editor
-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  student_id TEXT,
  department TEXT,
  role TEXT DEFAULT 'student',
  university_year INTEGER,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  origin_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  available_seats INTEGER NOT NULL DEFAULT 1,
  price_per_seat DECIMAL(10,2) NOT NULL DEFAULT 0,
  car_model TEXT,
  car_color TEXT,
  car_license TEXT,
  ride_type TEXT DEFAULT 'one-way',
  preferences TEXT,
  origin_lat DECIMAL(10,8),
  origin_lng DECIMAL(11,8),
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  status TEXT DEFAULT 'active',
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_name TEXT,
  driver_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  passenger_name TEXT,
  passenger_phone TEXT,
  seats_requested INTEGER NOT NULL DEFAULT 1,
  pickup_location TEXT,
  status TEXT DEFAULT 'pending',
  message TEXT,
  verification_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  type TEXT DEFAULT 'ride',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Rides policies
CREATE POLICY "Anyone can view active rides" ON rides
  FOR SELECT USING (status = 'active');

CREATE POLICY "Drivers can manage own rides" ON rides
  FOR ALL USING (auth.uid() = driver_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = passenger_id OR auth.uid() IN (
    SELECT driver_id FROM rides WHERE rides.id = bookings.ride_id
  ));

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update booking status" ON bookings
  FOR UPDATE USING (auth.uid() IN (
    SELECT driver_id FROM rides WHERE rides.id = bookings.ride_id
  ));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
`
}