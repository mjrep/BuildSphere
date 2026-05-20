const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

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
    const token = req.cookies?.['sb-access-token'];
    const supabaseWithAuth = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    try {
      if (token) {
        await supabaseWithAuth.auth.setSession({
          access_token: token,
          refresh_token: token
        });
      }

      const { 
        first_name, last_name, email, password, current_password,
        middle_name, suffix, phone_number, gender, birthdate, address
      } = req.body;
      const userId = req.user.id;

      if (password) {
        if (!current_password) {
          return res.status(422).json({
            message: 'Current password is required to change password.',
            errors: { current_password: ['Current password is required.'] }
          });
        }

        const { data: dbUser, error: dbUserError } = await supabaseAdmin
          .from('users')
          .select('password')
          .eq('id', userId)
          .single();

        if (dbUserError || !dbUser) {
          return res.status(404).json({ message: 'User record not found.' });
        }

        const isMatch = await bcrypt.compare(current_password, dbUser.password);
        if (!isMatch) {
          return res.status(422).json({
            message: 'Incorrect current password.',
            errors: { current_password: ['Incorrect current password.'] }
          });
        }
      }

      // 1. Update Auth data (email, password, and metadata)
      const authUpdates = {
        data: { 
          first_name, last_name, 
          middle_name: middle_name || null, 
          suffix: suffix || null, 
          phone_number: phone_number || null, 
          gender: gender || null, 
          birthdate: birthdate || null, 
          address: address || null
        }
      };
      if (email !== req.user.email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      const { error: authError } = await supabaseWithAuth.auth.updateUser(authUpdates);
      if (authError) {
        return res.status(422).json({
          message: authError.message,
          errors: { form: [authError.message] }
        });
      }

      // 2. Update public users table (requires RLS policy allowing self-update)
      const updates = { 
        first_name, 
        last_name, 
        email,
        middle_name: middle_name || null,
        suffix: suffix || null,
        phone_number: phone_number || null,
        gender: gender || null,
        birthdate: birthdate || null,
        address: address || null
      };
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }

      const { data: updatedUser, error: updateError } = await supabaseWithAuth
        .from('users')
        .update(updates)
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
