-- Check existing bookings to understand the duplicate key issue
-- Run this in Supabase SQL Editor

-- 1. Check all bookings in the system
SELECT 
    b.*,
    p.full_name as passenger_name,
    r.origin_name,
    r.destination_name
FROM bookings b
JOIN profiles p ON b.passenger_id = p.id
JOIN rides r ON b.ride_id = r.id
ORDER BY b.created_at DESC;

-- 2. Check if there are any duplicate bookings
SELECT 
    ride_id,
    passenger_id,
    COUNT(*) as booking_count
FROM bookings
GROUP BY ride_id, passenger_id
HAVING COUNT(*) > 1;

-- 3. If you need to delete duplicate/test bookings (BE CAREFUL!)
-- DELETE FROM bookings WHERE id = 'specific-booking-id-here';