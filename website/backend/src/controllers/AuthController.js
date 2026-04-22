const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
// Use Service Role Key if available for silent migration (bypassing email confirmation)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

class AuthController {
  static async login(req, res) {
    if (!supabase) return res.status(500).json({ message: 'Supabase client not initialized' });

    try {
      const { email, password } = req.body;
      
      // 1. First attempt standard Supabase Auth
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Handle unconfirmed emails if service key is present
      if (error && error.message === 'Email not confirmed' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log(`Force confirming email for: ${email}`);
        const { data: userListData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = userListData.users.find(u => u.email === email);
        
        if (existingUser) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
          const retry = await supabase.auth.signInWithPassword({ email, password });
          data = retry.data;
          error = retry.error;
        }
      }

      // 2. If it fails (and isn't just unconfirmed), check for a "Legacy Migration" user
      if (error && (error.message === 'Invalid login credentials' || error.status === 400 || error.message === 'Email not confirmed')) {
        const { data: legacyUser, error: legacyError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (legacyUser && legacyUser.password) {
          // Compare provided password with Laravel's Bcrypt hash
          const isMatch = await bcrypt.compare(password, legacyUser.password);
          
          if (isMatch) {
            console.log(`Auto-migrating legacy user: ${email}`);
            
            // Auto-register the user in Supabase Auth
            let signUpError;
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
              // Silent migration via Admin API
              const { error: adminError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                  first_name: legacyUser.first_name,
                  last_name: legacyUser.last_name,
                  role: legacyUser.role
                }
              });
              signUpError = adminError;
            } else {
              // Standard sign up (may require email confirmation)
              const { error: standardError } = await supabaseAdmin.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    first_name: legacyUser.first_name,
                    last_name: legacyUser.last_name,
                    role: legacyUser.role
                  }
                }
              });
              signUpError = standardError;
            }

            if (!signUpError) {
              // Retry login with the newly created Auth account
              const retry = await supabase.auth.signInWithPassword({ email, password });
              data = retry.data;
              error = retry.error;
            } else {
              console.error('Migration SignUp Error:', signUpError);
              error = signUpError;
            }
          }
        }
      }

      if (error) {
        console.error('Supabase Login Error:', error);
        return res.status(401).json({
          message: error.message,
          errors: { email: [error.message] }
        });
      }

      // Safely grab user details from public users table if they exist
      // Use email matching instead of ID because Auth IDs are UUIDs and public IDs are Integers
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      // Flatten user metadata if we are using the Auth user object instead of the public DB record
      const userToReturn = userData || data.user;
      if (!userData && data.user?.user_metadata) {
        Object.assign(userToReturn, data.user.user_metadata);
      }

      // Normalize role for consistent case-insensitive checks across the app
      if (userToReturn.role) {
        userToReturn.role = userToReturn.role.toLowerCase().replace(/\s+/g, '_');
      }

      // Set auth cookies for session persistence
      res.cookie('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: 'Logged in successfully.',
        user: userToReturn
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }

  static async register(req, res) {
    if (!supabase) return res.status(500).json({ message: 'Supabase client not initialized' });

    try {
      const { email, password, first_name, last_name, role } = req.body;
      
      // Attempt generic Supabase sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(422).json({
          message: error.message,
          errors: { email: [error.message] }
        });
      }

      // If successful, push custom attributes to the public users table
      if (data?.user) {
        await supabase.from('users').insert([{
           id: data.user.id,
           email,
           first_name,
           last_name,
           role
        }]);
      }

      res.status(201).json({
        message: 'Registration successful.',
        user: data?.user
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }

  static async logout(req, res) {
    if (!supabase) return res.status(500).json({ message: 'Supabase client not initialized' });

    try {
      await supabase.auth.signOut();
      res.clearCookie('sb-access-token');
      res.json({ message: 'Logged out successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error logging out' });
    }
  }

  static async index(req, res) {
    if (!supabase) return res.status(500).json({ message: 'Supabase client not initialized' });

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .order('first_name', { ascending: true });

      if (error) throw error;

      const formatted = (users || []).map(u => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        role: u.role
      }));

      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
  }
}

module.exports = AuthController;
