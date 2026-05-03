const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

class NotificationService {
    /**
     * Creates a notification and handles legacy date/time fields for mobile compatibility.
     */
    static async createNotification(userId, title, message, type = 'info', referenceUrl = null) {
        try {
            const now = new Date();
            
            // Legacy formatting for mobile app support
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            }); // HH:mm AM/PM

            const { data, error } = await supabase
                .from('notifications')
                .insert([{
                    user_id: userId,
                    title,
                    message,
                    type,
                    reference_url: referenceUrl,
                    is_read: false,
                    date: dateStr,
                    time: timeStr,
                    created_at: now.toISOString(),
                    updated_at: now.toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error creating notification:', err);
            throw err;
        }
    }
}

module.exports = NotificationService;
