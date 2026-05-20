const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('../utils/mailer');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
// Use Service Role Key if available for silent migration (bypassing email confirmation)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

class AuthController {
  static async forgotPassword(req, res) {
    if (!supabaseAdmin) return res.status(500).json({ message: 'Supabase admin client not initialized' });

    try {
      const { email } = req.body;
      if (!email) {
        return res.status(422).json({ message: 'Email address is required.', errors: { email: ['Email is required.'] } });
      }

      // Check if user exists in our local users db
      const { data: userData, error: dbError } = await supabaseAdmin
        .from('users')
        .select('first_name, last_name')
        .eq('email', email)
        .maybeSingle();

      if (dbError || !userData) {
        return res.json({ message: 'If the email exists in our system, a password reset link has been dispatched.' });
      }

      // Generate password recovery link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
        }
      });

      if (linkError) throw linkError;

      const actionLink = linkData?.properties?.action_link;

      // Send reset password email using custom SMTP mailer
      const mailResult = await sendPasswordResetEmail({
        to: email,
        name: `${userData.first_name} ${userData.last_name}`,
        actionLink
      });

      res.json({
        message: 'Password reset link sent successfully.',
        mail_method: mailResult.method
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ message: err.message });
    }
  }
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
        
      if (userData && userData.is_active === false) {
        return res.status(403).json({ 
          message: 'This account has been deactivated. Please contact HR or your Administrator.' 
        });
      }

      // Flatten user metadata if we are using the Auth user object instead of the public DB record
      const userToReturn = userData || data.user;
      if (!userData && data.user?.user_metadata) {
        Object.assign(userToReturn, data.user.user_metadata);
      }
      req.user = userToReturn;

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
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase.from('users').insert([{
           email,
           password: hashedPassword,
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
      const { role } = req.query;
      let query = supabase
        .from('users')
        .select('id, first_name, last_name, role');

      if (role) {
        query = query.eq('role', role);
      }

      const { data: users, error } = await query
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
