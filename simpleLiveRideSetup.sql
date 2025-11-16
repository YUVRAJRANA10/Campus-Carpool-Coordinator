-- Simple live ride lifecycle test
-- First, let's create just the essential live_rides table for testing

-- Create live_rides table for tracking active rides
CREATE TABLE IF NOT EXISTS live_rides (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT REFERENCES rides(id) ON DELETE CASCADE,
    booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE,
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

-- Add RLS policies for live_rides
ALTER TABLE live_rides ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own live rides (as driver or passenger)
CREATE POLICY "Users can view their own live rides" ON live_rides
    FOR SELECT 
    USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- Policy for drivers to update their live rides
CREATE POLICY "Drivers can update their live rides" ON live_rides
    FOR UPDATE 
    USING (auth.uid() = driver_id);

-- Policy for inserting live rides (when booking is accepted)
CREATE POLICY "System can create live rides" ON live_rides
    FOR INSERT 
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_rides_driver_id ON live_rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_live_rides_passenger_id ON live_rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_live_rides_ride_id ON live_rides(ride_id);
CREATE INDEX IF NOT EXISTS idx_live_rides_booking_id ON live_rides(booking_id);
CREATE INDEX IF NOT EXISTS idx_live_rides_status ON live_rides(ride_status);

-- Function to auto-populate driver and passenger IDs from booking
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
    FROM rides r
    JOIN bookings b ON b.ride_id = r.id
    WHERE r.id = NEW.ride_id AND b.id = NEW.booking_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically populate user IDs
CREATE TRIGGER trigger_populate_live_ride_users
    BEFORE INSERT ON live_rides
    FOR EACH ROW
    EXECUTE FUNCTION populate_live_ride_users();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_live_ride_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE TRIGGER trigger_update_live_ride_timestamp
    BEFORE UPDATE ON live_rides
    FOR EACH ROW
    EXECUTE FUNCTION update_live_ride_timestamp();

-- Add reviews table if it doesn't exist (simplified version)
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT REFERENCES rides(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_type VARCHAR(20) CHECK (reviewer_type IN ('driver', 'passenger')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews about them" ON reviews
    FOR SELECT 
    USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_user_id);

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT 
    WITH CHECK (auth.uid() = reviewer_id);

-- Test the setup
SELECT 'Live ride lifecycle tables created successfully!' as status;