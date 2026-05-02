const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

class NotificationController {
    static getSupabaseWithAuth(req) {
        const token = req.cookies?.['sb-access-token'];
        return createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
    }

    static async index(req, res) {
        try {
            const supabase = NotificationController.getSupabaseWithAuth(req);
            const userId = req.user.id;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            res.json({ data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching notifications', error: err.message });
        }
    }

    static async markAsRead(req, res) {
        try {
            const supabase = NotificationController.getSupabaseWithAuth(req);
            const { id } = req.params;
            const userId = req.user.id;

            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('user_id', userId) // Security check
                .select()
                .single();

            if (error) throw error;

            res.json({ data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error marking notification as read', error: err.message });
        }
    }

    static async markAllAsRead(req, res) {
        try {
            const supabase = NotificationController.getSupabaseWithAuth(req);
            const userId = req.user.id;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, updated_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;

            res.json({ message: 'All notifications marked as read' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error marking all as read', error: err.message });
        }
    }
}

module.exports = NotificationController;
