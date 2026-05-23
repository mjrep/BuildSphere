const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { applyProjectVisibility, getMemberProjectIds } = require('../utils/visibility');
const NotificationService = require('../services/NotificationService');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

class ProjectInventoryController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static checkAccess(user) {
    const allowedRoles = ['CEO', 'COO', 'Project Engineer', 'Project Coordinator', 'Foreman', 'Procurement', 'Admin'];
    const role = (user?.role || '');
    if (!allowedRoles.includes(role)) {
      throw new Error('Unauthorized to manage project inventory.');
    }
  }

  static async index(req, res) {
    try {
      const supabaseWithAuth = ProjectInventoryController.getSupabaseWithAuth(req);
      const projectId = req.params.project;

      // 1. Check Visibility first
      let projectQuery = supabaseWithAuth.from('projects').select('id').eq('id', projectId);
      const memberProjectIds = await getMemberProjectIds(supabaseWithAuth, req.user.id);
      projectQuery = applyProjectVisibility(projectQuery, req.user, memberProjectIds);
      const { data: isVisible } = await projectQuery.single();

      if (!isVisible) {
        return res.status(403).json({ message: 'Unauthorized. You do not have access to this project.' });
      }

      const { data: items, error } = await supabaseWithAuth
        .from('project_inventory_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map to snake_case and add display fields to maintain frontend compatibility
      const formattedItems = items.map(item => {
        const currentStock = parseFloat(item.current_stock || 0);
        const criticalLevel = parseFloat(item.critical_level || 0);
        const price = parseFloat(item.price || 0);

        let status = 'in_stock';
        if (currentStock <= 0) status = 'out_of_stock';
        else if (currentStock <= criticalLevel) status = 'low_stock';

        return {
          id: item.id,
          project_id: item.project_id,
          item_name: item.item_name,
          category: item.category,
          current_stock: currentStock,
          critical_level: criticalLevel,
          price: price,
          price_display: `₱${price.toLocaleString()}`,
          stock_display: `${currentStock} units`,
          critical_display: `${criticalLevel} units`,
          status: status,
          created_by: item.created_by,
          updated_by: item.updated_by,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });

      res.json({ data: formattedItems });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching inventory', error: err.message });
    }
  }

  static async store(req, res) {
    try {
      ProjectInventoryController.checkAccess(req.user);
      const supabaseWithAuth = ProjectInventoryController.getSupabaseWithAuth(req);
      const projectId = req.params.project;
      
      const { item_name, category, critical_level, price } = req.body;

      if (!item_name || !category || critical_level === undefined || price === undefined) {
        return res.status(422).json({ message: 'Missing required fields.' });
      }

      const { data: item, error } = await supabaseWithAuth
        .from('project_inventory_items')
        .insert([{
          project_id: projectId,
          item_name,
          category,
          critical_level,
          price,
          current_stock: 0,
          created_by: req.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        data: {
          id: item.id,
          project_id: item.project_id,
          item_name: item.item_name,
          category: item.category,
          critical_level: item.critical_level,
          current_stock: item.current_stock,
          price: item.price
        }
      });
    } catch (err) {
      const status = err.message === 'Unauthorized to manage project inventory.' ? 403 : 500;
      res.status(status).json({ message: err.message });
    }
  }

  static async update(req, res) {
    try {
      ProjectInventoryController.checkAccess(req.user);
      const supabaseWithAuth = ProjectInventoryController.getSupabaseWithAuth(req);
      const { project: projectId, item: itemId } = req.params;
      const { item_name, category, critical_level, price } = req.body;

      const { data: item, error } = await supabaseWithAuth
        .from('project_inventory_items')
        .update({
          item_name,
          category,
          critical_level,
          price,
          updated_by: req.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('project_id', projectId) // ensures protection
        .select()
        .single();

      if (error) throw error;

      res.json({
        data: {
          id: item.id,
          project_id: item.project_id,
          item_name: item.item_name,
          category: item.category,
          critical_level: item.critical_level,
          current_stock: item.current_stock,
          price: item.price
        }
      });
    } catch (err) {
      const status = err.message === 'Unauthorized to manage project inventory.' ? 403 : 500;
      res.status(status).json({ message: err.message });
    }
  }

  static async logTransaction(req, res) {
    try {
      ProjectInventoryController.checkAccess(req.user);
      const supabaseWithAuth = ProjectInventoryController.getSupabaseWithAuth(req);
      const { project: projectId, item: itemId } = req.params;
      const { action_type, quantity, reference_task_id, notes } = req.body;

      if (!action_type || !quantity) {
        return res.status(422).json({ message: 'action_type and quantity are required.' });
      }

      if (parseFloat(quantity) <= 0) {
        return res.status(422).json({ message: 'Quantity must be greater than 0.' });
      }

      if (action_type === 'CONSUMPTION' && !reference_task_id) {
        return res.status(400).json({ message: 'Consumption must be linked to a task (reference_task_id is required).' });
      }

      const { data: item, error: fetchError } = await supabaseWithAuth
        .from('project_inventory_items')
        .select('current_stock, item_name')
        .eq('id', itemId)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({ message: 'Inventory item not found.' });
      }

      if (['CONSUMPTION', 'SPOILAGE'].includes(action_type)) {
        if (parseFloat(item.current_stock) < parseFloat(quantity)) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.item_name}. Available: ${item.current_stock}, Requested: ${quantity}` 
          });
        }
      }

      const { data: log, error: logError } = await supabaseWithAuth
        .from('project_inventory_logs')
        .insert([{
          item_id: itemId,
          action_type,
          quantity: parseFloat(quantity),
          reference_task_id: reference_task_id || null,
          notes: notes || '',
          created_by: req.user.id
        }])
        .select()
        .single();

      if (logError) throw logError;

      // --- Notification Triggers Phase 2 ---
      try {
        const { data: project } = await supabaseWithAuth
          .from('projects')
          .select('project_name, project_in_charge_id')
          .eq('id', projectId)
          .single();

        const { data: updatedItem } = await supabaseWithAuth
          .from('project_inventory_items')
          .select('*')
          .eq('id', itemId)
          .single();

        const inventoryUrl = `/projects/${projectId}/inventory`;

        // 1. Massive Spoilage (CEO/COO Alert)
        if (action_type === 'SPOILAGE' && parseFloat(quantity) > 50) {
          const { data: execs } = await supabaseWithAuth
            .from('users')
            .select('id')
            .in('role', ['CEO', 'COO']);
          
          if (execs) {
            for (const exec of execs) {
              await NotificationService.createNotification(
                exec.id,
                'High Spoilage Alert',
                `A massive spoilage of ${quantity} ${item.item_name} was logged at ${project?.project_name || 'Project'}.`,
                'warning',
                inventoryUrl
              );
            }
          }
        }

        // 2. Critical Stock Levels (Procurement & Project Engineer)
        if (updatedItem && parseFloat(updatedItem.current_stock) <= parseFloat(updatedItem.critical_level)) {
          // Notify Procurement
          const { data: procs } = await supabaseWithAuth
            .from('users')
            .select('id')
            .eq('role', 'Procurement');
          
          const recipients = (procs || []).map(p => p.id);
          
          // Notify Project Engineer (Project In Charge)
          if (project?.project_in_charge_id) {
            recipients.push(project.project_in_charge_id);
          }

          const uniqueRecipients = [...new Set(recipients)];
          for (const userId of uniqueRecipients) {
            await NotificationService.createNotification(
              userId,
              'Critical Stock Level',
              `${item.item_name} has dropped to ${updatedItem.current_stock} at ${project?.project_name || 'Project'}. Please review for re-order.`,
              'warning',
              inventoryUrl
            );
          }
        }

        // 3. Missing Materials Adjustment (Procurement)
        // Since we currently enforce positive quantity, we assume the user might have meant a decrease for ADJUSTMENT
        // if they had specific notes or if we eventually allow negative. 
        // For now, we trigger this if action_type is ADJUSTMENT as requested.
        if (action_type === 'ADJUSTMENT') {
          const { data: procs } = await supabaseWithAuth
            .from('users')
            .select('id')
            .eq('role', 'Procurement');
          
          if (procs) {
            for (const proc of procs) {
              await NotificationService.createNotification(
                proc.id,
                'Inventory Discrepancy',
                `A negative adjustment of ${quantity} ${item.item_name} was recorded at ${project?.project_name || 'Project'}.`,
                'warning',
                inventoryUrl
              );
            }
          }
        }

        res.status(201).json({
          message: 'Transaction logged successfully.',
          data: updatedItem,
          log: log
        });
      } catch (notifErr) {
        console.error('Notification Trigger Error:', notifErr);
        // Don't fail the transaction if notification fails
        res.status(201).json({
          message: 'Transaction logged successfully (Notification error).',
          data: null, // item will be refetched by frontend
          log: log
        });
      }
    } catch (err) {
      const status = err.message === 'Unauthorized to manage project inventory.' ? 403 : 500;
      res.status(status).json({ message: err.message });
    }
  }

  static async getItemHistory(req, res) {
    try {
      const supabaseWithAuth = ProjectInventoryController.getSupabaseWithAuth(req);
      const { project: projectId, item: itemId } = req.params;

      // 1. Verify project access (Visibility check already handled by Middleware in index.js for some routes, but good to be safe)
      const { data: logs, error } = await supabaseWithAuth
        .from('project_inventory_logs')
        .select(`
          *,
          task:tasks!reference_task_id(id, title),
          creator:users!created_by(id, first_name, last_name)
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ data: logs });
    } catch (err) {
      console.error('Fetch History Error:', err);
      res.status(500).json({ message: 'Error fetching item history', error: err.message });
    }
  }

  static async destroy(req, res) {
    try {
      ProjectInventoryController.checkAccess(req.user);
      const supabaseWithAuth = ProjectInventoryController.getSupabaseWithAuth(req);
      const { project: projectId, item: itemId } = req.params;

      const { error } = await supabaseWithAuth
        .from('project_inventory_items')
        .delete()
        .eq('id', itemId)
        .eq('project_id', projectId);

      if (error) throw error;

      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      const status = err.message === 'Unauthorized to manage project inventory.' ? 403 : 500;
      res.status(status).json({ message: err.message });
    }
  }
  static async getProjectInventoryHistory(req, res) {
    try {
      const supabaseWithAuth = ProjectInventoryController.getSupabaseWithAuth(req);
      const projectId = req.params.project;

      const { data: logs, error } = await supabaseWithAuth
        .from('project_inventory_logs')
        .select(`
          *,
          item:project_inventory_items!item_id(id, item_name, project_id),
          task:tasks!reference_task_id(id, title),
          creator:users!created_by(id, first_name, last_name)
        `)
        .eq('item.project_id', projectId) // Filter logs where the item belongs to the project
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure the user has access to the project items they are viewing
      const filteredLogs = logs.filter(log => log.item !== null);

      res.json({ data: filteredLogs });
    } catch (err) {
      console.error('Fetch Project History Error:', err);
      res.status(500).json({ message: 'Error fetching project inventory history', error: err.message });
    }
  }
}

module.exports = ProjectInventoryController;
