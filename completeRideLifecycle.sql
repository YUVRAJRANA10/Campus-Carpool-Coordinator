-- Complete ride lifecycle database setup
-- Run this in Supabase SQL Editor

-- 1. Add all necessary columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dropoff_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS driver_location_lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS driver_location_lng DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS estimated_arrival TEXT,
ADD COLUMN IF NOT EXISTS ride_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ride_completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Update booking status to include more states
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'driver_arriving', 'ride_started', 'ride_completed', 'cancelled'));

-- 3. Update ride status to include booked state
ALTER TABLE public.rides 
DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE public.rides 
ADD CONSTRAINT rides_status_check 
CHECK (status IN ('active', 'booked', 'in_progress', 'completed', 'cancelled'));

-- 4. Create live_rides table for active ride tracking
CREATE TABLE IF NOT EXISTS public.live_rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  current_driver_lat DECIMAL(10,8),
  current_driver_lng DECIMAL(11,8),
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  estimated_pickup_time TIMESTAMP WITH TIME ZONE,
  estimated_arrival_time TIMESTAMP WITH TIME ZONE,
  ride_status TEXT DEFAULT 'confirmed' CHECK (ride_status IN ('confirmed', 'driver_arriving', 'arrived', 'pickup_complete', 'in_transit', 'completed')),
  driver_notes TEXT,
  passenger_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id)
);

-- 5. Enable realtime for live_rides
ALTER publication supabase_realtime ADD TABLE public.live_rides;

-- 6. Add RLS policies for live_rides
CREATE POLICY "Users can view their live rides" ON public.live_rides
  FOR SELECT USING (
    auth.uid() = driver_id OR auth.uid() = passenger_id
  );

CREATE POLICY "Drivers can update their live rides" ON public.live_rides
  FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Users can create live rides" ON public.live_rides
  FOR INSERT WITH CHECK (
    auth.uid() = driver_id OR auth.uid() = passenger_id
  );

-- 7. Create function to automatically create live_ride when booking is confirmed
CREATE OR REPLACE FUNCTION create_live_ride()
RETURNS trigger AS $$
BEGIN
  -- Only create live ride when status changes to confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.live_rides (
      ride_id,
      booking_id,
      driver_id,
      passenger_id,
      pickup_lat,
      pickup_lng,
      destination_lat,
      destination_lng,
      estimated_pickup_time
    )
    SELECT 
      r.id,
      NEW.id,
      r.driver_id,
      NEW.passenger_id,
      r.origin_lat,
      r.origin_lng,
      r.destination_lat,
      r.destination_lng,
      r.departure_time
    FROM rides r 
    WHERE r.id = NEW.ride_id
    ON CONFLICT (booking_id) DO NOTHING;
    
    -- Update ride status to booked
    UPDATE rides SET status = 'booked', available_seats = available_seats - NEW.seats_booked 
    WHERE id = NEW.ride_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for live ride creation
DROP TRIGGER IF EXISTS create_live_ride_trigger ON public.bookings;
CREATE TRIGGER create_live_ride_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION create_live_ride();

-- 9. Verify setup
SELECT 'Bookings columns:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public' 
ORDER BY ordinal_position;

SELECT 'Live rides table created:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'live_rides' AND table_schema = 'public' 
ORDER BY ordinal_position;