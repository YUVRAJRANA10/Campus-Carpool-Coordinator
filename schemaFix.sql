-- Fix schema mismatches between database and application code
-- Run this in Supabase SQL Editor to align the schema with your app

-- 1. Make coordinate columns optional (since app doesn't always send them)
ALTER TABLE public.rides ALTER COLUMN origin_lat DROP NOT NULL;
ALTER TABLE public.rides ALTER COLUMN origin_lng DROP NOT NULL;
ALTER TABLE public.rides ALTER COLUMN destination_lat DROP NOT NULL;
ALTER TABLE public.rides ALTER COLUMN destination_lng DROP NOT NULL;

-- 2. Make title optional (since app doesn't always send it)
ALTER TABLE public.rides ALTER COLUMN title DROP NOT NULL;

-- 3. Set default values for coordinates
ALTER TABLE public.rides ALTER COLUMN origin_lat SET DEFAULT 0.0;
ALTER TABLE public.rides ALTER COLUMN origin_lng SET DEFAULT 0.0;
ALTER TABLE public.rides ALTER COLUMN destination_lat SET DEFAULT 0.0;
ALTER TABLE public.rides ALTER COLUMN destination_lng SET DEFAULT 0.0;

-- 4. Make sure profiles table has the 'role' column that your code expects
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'student';
    END IF;
END $$;

-- 5. Update your existing ride to have default values if coordinates are missing
UPDATE public.rides 
SET 
    origin_lat = COALESCE(origin_lat, 0.0),
    origin_lng = COALESCE(origin_lng, 0.0),
    destination_lat = COALESCE(destination_lat, 0.0),
    destination_lng = COALESCE(destination_lng, 0.0),
    title = COALESCE(title, origin_name || ' to ' || destination_name)
WHERE origin_lat IS NULL OR origin_lng IS NULL OR destination_lat IS NULL OR destination_lng IS NULL OR title IS NULL;

-- 6. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'rides' AND table_schema = 'public'
AND column_name IN ('origin_lat', 'origin_lng', 'destination_lat', 'destination_lng', 'title')
ORDER BY column_name;