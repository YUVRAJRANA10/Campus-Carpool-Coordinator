-- Fix all database issues step by step
-- Run this in Supabase SQL Editor

-- 1. First, add missing columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE;

-- 2. Create live_rides table for tracking active rides
CREATE TABLE IF NOT EXISTS public.live_rides (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT REFERENCES public.rides(id) ON DELETE CASCADE,
    booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_code VARCHAR(10),
    ride_status VARCHAR(50) DEFAULT 'confirmed' CHECK (ride_status IN ('confirmed', 'driver_arriving', 'arrived', 'pickup_complete', 'in_transit', 'completed')),
    driver_location_lat DECIMAL(10, 8),
    driver_location_lng DECIMAL(11, 8),
    pickup_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS for live_rides
ALTER TABLE public.live_rides ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for live_rides
DROP POLICY IF EXISTS "Users can view their own live rides" ON public.live_rides;
CREATE POLICY "Users can view their own live rides" ON public.live_rides
    FOR SELECT 
    USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

DROP POLICY IF EXISTS "Drivers can update their live rides" ON public.live_rides;
CREATE POLICY "Drivers can update their live rides" ON public.live_rides
    FOR UPDATE 
    USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "System can create live rides" ON public.live_rides;
CREATE POLICY "System can create live rides" ON public.live_rides
    FOR INSERT 
    WITH CHECK (true);

-- 5. Create reviews table for post-trip ratings
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT REFERENCES public.rides(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_type VARCHAR(20) CHECK (reviewer_type IN ('driver', 'passenger')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for reviews
DROP POLICY IF EXISTS "Users can view reviews about them" ON public.reviews;
CREATE POLICY "Users can view reviews about them" ON public.reviews
    FOR SELECT 
    USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_user_id);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
    FOR INSERT 
    WITH CHECK (auth.uid() = reviewer_id);

-- 8. Add rating column to profiles if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_rides_driver_id ON public.live_rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_live_rides_passenger_id ON public.live_rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_live_rides_ride_id ON public.live_rides(ride_id);
CREATE INDEX IF NOT EXISTS idx_live_rides_booking_id ON public.live_rides(booking_id);
CREATE INDEX IF NOT EXISTS idx_live_rides_status ON public.live_rides(ride_status);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user_id ON public.reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ride_id ON public.reviews(ride_id);

-- 10. Function to auto-populate driver and passenger IDs from booking
CREATE OR REPLACE FUNCTION populate_live_ride_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Get driver_id from the ride and passenger_id from the booking
    SELECT 
        r.driver_id,
        b.passenger_id
    INTO 
        NEW.driver_id,
        NEW.passenger_id
    FROM public.rides r
    JOIN public.bookings b ON b.ride_id = r.id
    WHERE r.id = NEW.ride_id AND b.id = NEW.booking_id;
    
    -- Set updated_at
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for auto-populating user IDs
DROP TRIGGER IF EXISTS trigger_populate_live_ride_users ON public.live_rides;
CREATE TRIGGER trigger_populate_live_ride_users
    BEFORE INSERT ON public.live_rides
    FOR EACH ROW
    EXECUTE FUNCTION populate_live_ride_users();

-- 12. Function to update timestamp
CREATE OR REPLACE FUNCTION update_live_ride_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger for updating timestamps
DROP TRIGGER IF EXISTS trigger_update_live_ride_timestamp ON public.live_rides;
CREATE TRIGGER trigger_update_live_ride_timestamp
    BEFORE UPDATE ON public.live_rides
    FOR EACH ROW
    EXECUTE FUNCTION update_live_ride_timestamp();

-- 14. Verify all tables exist
SELECT 
    schemaname,
    tablename,
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('rides', 'bookings', 'live_rides', 'reviews', 'profiles')
ORDER BY tablename;

-- 15. Check if all columns exist in bookings table
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Database setup completed successfully! ✅' as status;