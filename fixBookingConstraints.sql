-- Fix booking constraints and add missing columns
-- Run this in Supabase SQL Editor to fix the booking issues

-- 1. First, let's check what's causing the constraint violation
SELECT constraint_name, constraint_type, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'rides' AND constraint_name LIKE '%available_seats%';

-- 2. Drop the problematic constraint temporarily (we'll recreate it properly)
ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_available_seats_check;

-- 3. Add a more flexible constraint
ALTER TABLE public.rides ADD CONSTRAINT rides_available_seats_check 
    CHECK (available_seats >= 0 AND available_seats <= 8);

-- 4. Make sure bookings table has all required columns
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pickup_location TEXT;

-- 5. Update any existing bookings that might be missing data
UPDATE public.bookings 
SET total_amount = COALESCE(total_amount, 0)
WHERE total_amount IS NULL;

UPDATE public.bookings 
SET pickup_location = COALESCE(pickup_location, 'Campus')
WHERE pickup_location IS NULL;

-- 6. Check current rides and bookings data
SELECT 'Current rides data:' as info;
SELECT 
    r.id,
    r.driver_id,
    r.available_seats,
    r.status,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
    SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings
FROM public.rides r
LEFT JOIN public.bookings b ON r.id = b.ride_id
GROUP BY r.id, r.driver_id, r.available_seats, r.status
ORDER BY r.created_at DESC
LIMIT 5;

-- 7. Check current bookings data
SELECT 'Current bookings data:' as info;
SELECT 
    b.id,
    b.ride_id,
    b.passenger_id,
    b.status,
    b.seats_booked,
    b.total_amount,
    b.verification_code,
    r.origin_name || ' → ' || r.destination_name as route
FROM public.bookings b
JOIN public.rides r ON b.ride_id = r.id
ORDER BY b.created_at DESC
LIMIT 5;

-- 8. Create a function to safely respond to bookings
CREATE OR REPLACE FUNCTION safe_respond_to_booking(
    p_booking_id BIGINT,
    p_response TEXT,
    p_verification_code TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_ride RECORD;
    v_result JSONB;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking 
    FROM public.bookings 
    WHERE id = p_booking_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Booking not found or already processed'
        );
    END IF;
    
    -- Get ride details
    SELECT * INTO v_ride 
    FROM public.rides 
    WHERE id = v_booking.ride_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Ride not found'
        );
    END IF;
    
    -- Process the response
    IF p_response = 'accept' THEN
        -- Check if enough seats available
        IF v_ride.available_seats < v_booking.seats_booked THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'Not enough seats available'
            );
        END IF;
        
        -- Update booking status
        UPDATE public.bookings 
        SET 
            status = 'confirmed',
            verification_code = p_verification_code,
            updated_at = NOW()
        WHERE id = p_booking_id;
        
        -- Update available seats (safely)
        UPDATE public.rides 
        SET 
            available_seats = GREATEST(0, available_seats - v_booking.seats_booked),
            updated_at = NOW()
        WHERE id = v_booking.ride_id;
        
        v_result = jsonb_build_object(
            'success', true, 
            'status', 'confirmed',
            'verification_code', p_verification_code
        );
    ELSE
        -- Decline the booking
        UPDATE public.bookings 
        SET 
            status = 'cancelled',
            updated_at = NOW()
        WHERE id = p_booking_id;
        
        v_result = jsonb_build_object(
            'success', true, 
            'status', 'cancelled'
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION safe_respond_to_booking TO authenticated;

SELECT 'Booking constraints fixed! You can now accept/decline bookings safely.' as status;