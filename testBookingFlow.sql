-- Test the booking flow by creating sample data
-- Run this AFTER running fixDatabaseIssues.sql

-- First, let's see what data we currently have
SELECT 'Current rides:' as info;
SELECT 
  id,
  driver_id,
  origin_name,
  destination_name,
  departure_time,
  available_seats,
  status
FROM rides 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Current bookings:' as info;
SELECT 
  id,
  ride_id,
  passenger_id,
  status,
  created_at
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;

-- To test the booking flow properly, you need a second user
-- Here's how to test:

-- STEP 1: Create the missing database tables first
-- Run fixDatabaseIssues.sql in Supabase SQL Editor

-- STEP 2: Test with a second browser/incognito window
-- 1. In regular browser: Login as YUVRAJ (driver)
-- 2. In incognito: Register/login as a different user (passenger)
-- 3. In incognito: Go to Find Rides and book YUVRAJ's ride
-- 4. In regular browser: Check dashboard - you should see booking request

-- STEP 3: If you want to test with same user (for development only)
-- Let's temporarily disable self-booking prevention:

-- This shows your current user ID for reference
SELECT 'Your current auth user info:' as info;
SELECT 
  auth.uid() as your_user_id,
  email 
FROM auth.users 
WHERE id = auth.uid();

-- Check if you can see any rides that aren't yours
SELECT 'Rides from other drivers:' as info;
SELECT 
  id,
  driver_id,
  origin_name || ' → ' || destination_name as route,
  departure_time,
  available_seats
FROM rides 
WHERE driver_id != auth.uid() 
  AND status = 'active'
ORDER BY created_at DESC;

-- If no other rides exist, the issue is you're trying to book your own ride
-- The system correctly prevents this with: "You cannot book your own ride!"

SELECT 'Next steps:' as recommendation;
SELECT '1. Run fixDatabaseIssues.sql to create missing tables' as step;
SELECT '2. Use incognito browser to create second user account' as step;
SELECT '3. Test booking flow between different users' as step;
SELECT '4. Check dashboard for booking requests' as step;