const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

class ProjectApprovalController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static getSupabaseAdmin() {
    return createClient(supabaseUrl, supabaseServiceKey);
  }

  static async accountingApproval(req, res) {
    try {
      const supabaseAdmin = ProjectApprovalController.getSupabaseAdmin();
      const projectIdRaw = req.params.project; // Corrected to match index.js route :project
      const projectId = parseInt(projectIdRaw);
      const { decision, comments } = req.body;
      const user = req.user;

      if (isNaN(projectId)) {
        return res.status(422).json({ 
          message: 'Invalid project ID format.', 
          received: projectIdRaw,
          hint: 'Check if the route parameter matches :project'
        });
      }

      if (!['APPROVED', 'REJECTED'].includes(decision)) {
        return res.status(422).json({ message: 'Invalid decision.' });
      }

      // 1. Fetch project to check status
      const { data: project, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (fetchError || !project) {
        return res.status(404).json({ 
          message: 'Project not found', 
          error: fetchError?.message,
          queried_id: projectId 
        });
      }

      const subStatus = (project.sub_status || '').toLowerCase();
      if (subStatus !== 'pending_approval' || project.accounting_approved_at !== null) {
        return res.status(422).json({ 
          message: 'This project is not pending accounting approval.',
          current_sub_status: project.sub_status,
          approved_at: project.accounting_approved_at
        });
      }

      // 2. Perform updates
      const updates = {};
      let actionName = '';
      let desc = '';
      const oldStatus = project.status;
      const oldSubStatus = project.sub_status;
      let newStatus = project.status;
      let newSubStatus = null;
      
      if (decision === 'APPROVED') {
        newSubStatus = 'pending_approval';
        updates.sub_status = newSubStatus;
        updates.accounting_approved_by = user.id;
        updates.accounting_approved_at = new Date().toISOString();
        actionName = 'ACCOUNTING_APPROVED';
        desc = 'Accounting approved the project. Now pending executive approval.';
      } else {
        newSubStatus = 'for_revision';
        updates.sub_status = newSubStatus;
        updates.rejected_by = user.id;
        updates.rejection_reason = comments;
        actionName = 'ACCOUNTING_REJECTED';
        desc = `Accounting rejected: ${comments}`;
      }

      const { data: updatedProject, error: updateError } = await supabaseAdmin
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ message: 'Update failed', error: updateError.message });
      }

      // 3. Log Records
      try {
        await supabaseAdmin.from('project_approvals').insert([{
          project_id: projectId,
          approval_stage: 'ACCOUNTING',
          approver_user_id: user.id,
          decision,
          comments: comments || '',
          decided_at: new Date().toISOString()
        }]);

        await supabaseAdmin.from('project_activity_logs').insert([{
          project_id: projectId,
          user_id: user.id,
          action: actionName,
          description: desc
        }]);

        await supabaseAdmin.from('project_revisions').insert([{
          project_id: projectId,
          from_status: `${oldStatus}:${oldSubStatus}`,
          to_status: `${newStatus}:${newSubStatus}`,
          requested_by: user.id,
          comments: comments || ''
        }]);
      } catch (logError) {
        console.error('Logging records failed:', logError);
      }

      res.json({ data: updatedProject });
    } catch (err) {
      console.error('Accounting Approval Error:', err);
      res.status(500).json({ message: err.message || 'Error processing accounting approval' });
    }
  }

  static async executiveApproval(req, res) {
    try {
      const supabaseAdmin = ProjectApprovalController.getSupabaseAdmin();
      const projectIdRaw = req.params.project; // Corrected to match index.js route :project
      const projectId = parseInt(projectIdRaw);
      const { decision, comments } = req.body;
      const user = req.user;

      if (isNaN(projectId)) {
        return res.status(422).json({ 
          message: 'Invalid project ID format.', 
          received: projectIdRaw,
          hint: 'Check if the route parameter matches :project'
        });
      }

      if (!['APPROVED', 'REJECTED'].includes(decision)) {
        return res.status(422).json({ message: 'Invalid decision.' });
      }

      // 1. Fetch project to check status
      const { data: project, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (fetchError || !project) {
        return res.status(404).json({ 
          message: 'Project not found', 
          error: fetchError?.message,
          queried_id: projectId 
        });
      }

      const subStatus = (project.sub_status || '').toLowerCase();
      if (subStatus !== 'pending_approval' || project.accounting_approved_at === null) {
        return res.status(422).json({ 
          message: 'This project is not pending executive approval.',
          current_sub_status: project.sub_status,
          accounting_approved_at: project.accounting_approved_at
        });
      }

      // 2. Perform updates
      const updates = {};
      let actionName = '';
      let desc = '';
      const oldStatus = project.status;
      const oldSubStatus = project.sub_status;
      let newStatus = project.status;
      let newSubStatus = null;
      
      if (decision === 'APPROVED') {
        newStatus = 'ongoing';
        newSubStatus = null;
        updates.status = newStatus;
        updates.sub_status = newSubStatus;
        updates.executive_approved_by = user.id;
        updates.executive_approved_at = new Date().toISOString();
        actionName = 'EXECUTIVE_APPROVED';
        desc = 'Executive approved the project. Project is now ongoing.';
      } else {
        newSubStatus = 'for_revision';
        updates.sub_status = newSubStatus;
        updates.rejected_by = user.id;
        updates.rejection_reason = comments;
        actionName = 'EXECUTIVE_REJECTED';
        desc = `Executive rejected: ${comments}`;
      }

      const { data: updatedProject, error: updateError } = await supabaseAdmin
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ message: 'Update failed', error: updateError.message });
      }

      // 3. Log Records
      try {
        await supabaseAdmin.from('project_approvals').insert([{
          project_id: projectId,
          approval_stage: 'EXECUTIVE',
          approver_user_id: user.id,
          decision,
          comments: comments || '',
          decided_at: new Date().toISOString()
        }]);

        await supabaseAdmin.from('project_activity_logs').insert([{
          project_id: projectId,
          user_id: user.id,
          action: actionName,
          description: desc
        }]);

        await supabaseAdmin.from('project_revisions').insert([{
          project_id: projectId,
          from_status: `${oldStatus}:${oldSubStatus}`,
          to_status: `${newStatus}${newSubStatus ? ':' + newSubStatus : ''}`,
          requested_by: user.id,
          comments: comments || ''
        }]);
      } catch (logError) {
        console.error('Logging records failed:', logError);
      }

      res.json({ data: updatedProject });
    } catch (err) {
      console.error('Executive Approval Error:', err);
      res.status(500).json({ message: err.message || 'Error processing executive approval' });
    }
  }
}

module.exports = ProjectApprovalController;
