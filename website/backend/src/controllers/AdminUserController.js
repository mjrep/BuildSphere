const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

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
      const { email, first_name, last_name, role } = req.body;

      if (!email || !first_name || !last_name || !role) {
        return res.status(422).json({ message: 'All fields are required.' });
      }

      // 1. Invite user via Supabase Auth
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { first_name, last_name, role },
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/set-password`
      });

      if (inviteError) throw inviteError;

      // 2. Insert into public users table
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: inviteData.user.id,
          email,
          first_name,
          last_name,
          role,
          is_active: true
        }]);

      if (dbError) {
        // If DB insert fails, we might want to delete the auth user to stay in sync
        console.error('Database Sync Error:', dbError);
        // await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id);
        throw dbError;
      }

      res.status(201).json({ message: 'Invitation sent successfully.', user: inviteData.user });
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

      // Also update Auth metadata to keep it in sync
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { role }
      });

      res.json({ message: 'User role updated successfully.', data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AdminUserController;
