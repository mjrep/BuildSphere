-- SQL Migration: Updating Notifications for Web & Realtime

-- 1. Add reference_url to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_url TEXT;

-- 2. Enable Supabase Realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. (Optional) Ensure performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
