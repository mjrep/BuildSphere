-- Add profile_picture_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Verify columns in site_progress (should already be there, but just in case)
-- ALTER TABLE site_progress ADD COLUMN IF NOT EXISTS glass_count INTEGER DEFAULT 0;
