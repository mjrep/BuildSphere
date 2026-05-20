const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { sendCredentialsEmail } = require('../utils/mailer');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin client for user management
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class AdminUserController {
  static getFrontendResetUrl() {
    return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`;
  }
  
  static checkAccess(user) {
    const allowedRoles = ['CEO', 'COO', 'HR'];
    if (!allowedRoles.includes(user?.role)) {
      throw new Error('Unauthorized access to administrative tools.');
    }
  }

  static async index(req, res) {
    try {
      AdminUserController.checkAccess(req.user);
      
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ data: users });
    } catch (err) {
      console.error(err);
      const status = err.message.includes('Unauthorized') ? 403 : 500;
      res.status(status).json({ message: err.message });
    }
  }

  static async invite(req, res) {
    try {
      AdminUserController.checkAccess(req.user);
      const { 
        email, first_name, last_name, role,
        middle_name, suffix, phone_number, gender, birthdate, address 
      } = req.body;

      if (!email || !first_name || !last_name || !role) {
        return res.status(422).json({ message: 'All fields are required.' });
      }

      // Generate a strong preset password for immediate Web & Mobile logins
      const presetPassword = Math.random().toString(36).slice(-8) + 'A1!';

      // 1. Create user directly via Supabase Auth
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: presetPassword,
        email_confirm: true,
        user_metadata: { 
          first_name, last_name, role,
          middle_name, suffix, phone_number, gender, birthdate, address
        }
      });

      if (createError) throw createError;

      // 2. Insert user into the local database with bcrypt-hashed preset password
      const hashedPassword = await bcrypt.hash(presetPassword, 10);
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert([{
          email,
          password: hashedPassword,
          first_name,
          last_name,
          role,
          is_active: true,
          middle_name: middle_name || null,
          suffix: suffix || null,
          phone_number: phone_number || null,
          gender: gender || null,
          birthdate: birthdate || null,
          address: address || null
        }]);

      if (dbError) {
        // Cleanup created Auth user if local DB sync fails
        console.error('Database Sync Error, cleaning up auth user:', dbError);
        await supabaseAdmin.auth.admin.deleteUser(createData.user.id);
        throw dbError;
      }

      // 3. Generate a password recovery/update link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: AdminUserController.getFrontendResetUrl()
        }
      });

      if (linkError) {
        console.error('Failed to generate recovery link:', linkError);
      }

      const actionLink = linkData?.properties?.action_link || AdminUserController.getFrontendResetUrl();

      // 4. Send credentials email containing preset password and recovery link
      const mailResult = await sendCredentialsEmail({
        to: email,
        name: `${first_name} ${last_name}`,
        password: presetPassword,
        actionLink
      });

      res.status(201).json({
        message: 'Personnel added successfully and credentials email dispatched.',
        user: createData.user,
        temp_password: presetPassword,
        action_link: actionLink,
        mail_method: mailResult.method
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }

  static async toggleStatus(req, res) {
    try {
      AdminUserController.checkAccess(req.user);
      const { id } = req.params;
      const { is_active } = req.body;

      if (is_active === undefined) {
        return res.status(422).json({ message: 'is_active status is required.' });
      }

      // Prevent deactivating yourself
      if (id === req.user.id) {
        return res.status(400).json({ message: 'You cannot deactivate your own account.' });
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ message: `Account ${is_active ? 'activated' : 'deactivated'} successfully.`, data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }

  static async updateRole(req, res) {
    try {
      AdminUserController.checkAccess(req.user);
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(422).json({ message: 'Role is required.' });
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Also update Auth metadata to keep it in sync by finding the auth user's UUID by email
      const { data: userListData } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = userListData?.users?.find(u => u.email === user.email);
      if (authUser) {
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          user_metadata: { role }
        });
      }

      res.json({ message: 'User role updated successfully.', data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AdminUserController;
