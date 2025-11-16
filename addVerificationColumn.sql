-- Add missing verification_code column to bookings table
-- Run this in Supabase SQL Editor

-- 1. Add verification_code column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- 2. Add pickup_time column if needed  
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE;

-- 3. Verify the new columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;