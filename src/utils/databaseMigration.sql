-- Database migration to ensure all required columns exist
-- Run this SQL in your Supabase SQL Editor if you get column errors

-- First, let's check the current rides table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'rides' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Add missing columns to rides table if they don't exist
DO $$ 
BEGIN
    -- Add driver_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'driver_name' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN driver_name TEXT;
    END IF;
    
    -- Add driver_phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'driver_phone' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN driver_phone TEXT;
    END IF;
    
    -- Add origin_lat column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'origin_lat' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN origin_lat DECIMAL(10,8);
    END IF;
    
    -- Add origin_lng column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'origin_lng' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN origin_lng DECIMAL(11,8);
    END IF;
    
    -- Add destination_lat column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'destination_lat' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN destination_lat DECIMAL(10,8);
    END IF;
    
    -- Add destination_lng column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'destination_lng' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN destination_lng DECIMAL(11,8);
    END IF;
    
    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'preferences' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN preferences TEXT;
    END IF;
    
    -- Add car_model column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'car_model' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN car_model TEXT;
    END IF;
    
    -- Add car_color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'car_color' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN car_color TEXT;
    END IF;
    
    -- Add car_license column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'car_license' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN car_license TEXT;
    END IF;
    
    -- Add ride_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'ride_type' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN ride_type TEXT DEFAULT 'one-way';
    END IF;
    
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'title' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN title TEXT;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rides' AND column_name = 'description' AND table_schema = 'public') THEN
        ALTER TABLE rides ADD COLUMN description TEXT;
    END IF;
    
END $$;

-- Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'rides' AND table_schema = 'public'
ORDER BY ordinal_position;