const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { applyProjectVisibility } = require('../utils/visibility');

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
      projectQuery = applyProjectVisibility(projectQuery, req.user);
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

        let status = 'In Stock';
        if (currentStock === 0) status = 'Out of Stock';
        else if (currentStock <= criticalLevel) status = 'Low Stock';

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

  static async updateStock(req, res) {
    try {
      ProjectInventoryController.checkAccess(req.user);
      const supabaseWithAuth = ProjectInventoryController.getSupabaseWithAuth(req);
      const { project: projectId, item: itemId } = req.params;
      const { current_stock } = req.body;

      if (current_stock === undefined) return res.status(422).json({ message: 'current_stock is required' });

      const { data: item, error } = await supabaseWithAuth
        .from('project_inventory_items')
        .update({
          current_stock,
          updated_by: req.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('project_id', projectId)
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
}

module.exports = ProjectInventoryController;
