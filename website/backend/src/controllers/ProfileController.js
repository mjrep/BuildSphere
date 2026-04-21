const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
// Needs service role key to update other user's auth records if not authenticated dynamically
// but since we extract the user's JWT from cookie, we need to initialize supabase WITH that JWT token context
class ProfileController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }

  static async show(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }
    res.json(req.user);
  }

  static async update(req, res) {
    const supabaseWithAuth = ProfileController.getSupabaseWithAuth(req);

    try {
      const { first_name, last_name, email, password } = req.body;
      const userId = req.user.id;

      // 1. Update Auth data (email or password)
      const authUpdates = {};
      if (email !== req.user.email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseWithAuth.auth.updateUser(authUpdates);
        if (authError) {
          return res.status(422).json({
            message: authError.message,
            errors: { form: [authError.message] }
          });
        }
      }

      // 2. Update public users table (requires RLS policy allowing self-update)
      const { data: updatedUser, error: updateError } = await supabaseWithAuth
        .from('users')
        .update({ first_name, last_name, email })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({
        message: 'Profile updated successfully.',
        user: updatedUser || { ...req.user, first_name, last_name, email }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
  }
}

module.exports = ProfileController;
