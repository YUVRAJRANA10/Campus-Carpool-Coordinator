-- Ensure all users have proper profiles
INSERT INTO profiles (
    id, 
    full_name, 
    email, 
    phone, 
    department, 
    role, 
    rating, 
    total_rides,
    created_at,
    updated_at
)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
    email,
    COALESCE(raw_user_meta_data->>'phone', '+91-0000000000') as phone,
    COALESCE(raw_user_meta_data->>'department', 'Computer Science') as department,
    'student' as role,
    4.8 as rating,
    0 as total_rides,
    created_at,
    NOW() as updated_at
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    department = COALESCE(EXCLUDED.department, profiles.department),
    updated_at = NOW();

-- Update existing profiles with proper names if they're missing
UPDATE profiles 
SET full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE auth.users.id = profiles.id),
    split_part(email, '@', 1)
)
WHERE full_name IS NULL OR full_name = '' OR length(full_name) < 2;