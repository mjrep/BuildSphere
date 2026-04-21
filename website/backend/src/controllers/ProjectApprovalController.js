const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

class ProjectApprovalController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static async accountingApproval(req, res) {
    try {
      const supabaseWithAuth = ProjectApprovalController.getSupabaseWithAuth(req);
      const projectId = req.params.project;
      const { decision, comments } = req.body;
      const user = req.user;

      if (!['APPROVED', 'REJECTED'].includes(decision)) {
        return res.status(422).json({ message: 'Invalid decision.' });
      }

      // 1. Fetch project to check status
      const { data: project, error: fetchError } = await supabaseWithAuth
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (fetchError || !project) throw fetchError || new Error('Project not found');

      if (project.sub_status !== 'Pending Approval' || project.accounting_approved_at !== null) {
        return res.status(422).json({ message: 'This project is not pending accounting approval.' });
      }

      // 2. Perform updates
      const oldStatus = project.status;
      const oldSubStatus = project.sub_status;
      let newSubStatus = null;
      let newStatus = project.status;
      const updates = {};
      let actionName = '';
      let desc = '';
      
      if (decision === 'APPROVED') {
        newSubStatus = 'Pending Approval'; // Still pending approval for executive
        updates.sub_status = newSubStatus;
        updates.accounting_approved_by = user.id;
        updates.accounting_approved_at = new Date().toISOString();
        actionName = 'ACCOUNTING_APPROVED';
        desc = 'Accounting approved the project. Now pending executive approval.';
      } else {
        newSubStatus = 'For Revision';
        updates.sub_status = newSubStatus;
        updates.rejected_by = user.id;
        updates.rejection_reason = comments;
        actionName = 'ACCOUNTING_REJECTED';
        desc = `Accounting rejected: ${comments}`;
      }

      const { data: updatedProject, error: updateError } = await supabaseWithAuth
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. Log Records
      await supabaseWithAuth.from('project_approvals').insert([{
        project_id: projectId,
        approval_stage: 'ACCOUNTING',
        approver_user_id: user.id,
        decision,
        comments,
        decided_at: new Date().toISOString()
      }]);

      await supabaseWithAuth.from('project_activity_logs').insert([{
        project_id: projectId,
        user_id: user.id,
        action: actionName,
        description: desc
      }]);

      await supabaseWithAuth.from('project_revisions').insert([{
        project_id: projectId,
        from_status: `${oldStatus}:${oldSubStatus}`,
        to_status: `${newStatus}:${newSubStatus}`,
        requested_by: user.id,
        comments
      }]);

      res.json({ data: updatedProject });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error processing accounting approval', error: err.message });
    }
  }

  static async executiveApproval(req, res) {
    try {
      const supabaseWithAuth = ProjectApprovalController.getSupabaseWithAuth(req);
      const projectId = req.params.project;
      const { decision, comments } = req.body;
      const user = req.user;

      if (!['APPROVED', 'REJECTED'].includes(decision)) {
        return res.status(422).json({ message: 'Invalid decision.' });
      }

      // 1. Fetch project to check status
      const { data: project, error: fetchError } = await supabaseWithAuth
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (fetchError || !project) throw fetchError || new Error('Project not found');

      if (project.sub_status !== 'Pending Approval' || project.accounting_approved_at === null) {
        return res.status(422).json({ message: 'This project is not pending executive approval.' });
      }

      // 2. Perform updates
      const oldStatus = project.status;
      const oldSubStatus = project.sub_status;
      const updates = {};
      let actionName = '';
      let desc = '';
      let newStatus = project.status;
      let newSubStatus = null;
      
      if (decision === 'APPROVED') {
        newStatus = 'Ongoing';
        newSubStatus = null;
        updates.status = newStatus;
        updates.sub_status = newSubStatus;
        updates.executive_approved_by = user.id;
        updates.executive_approved_at = new Date().toISOString();
        actionName = 'EXECUTIVE_APPROVED';
        desc = 'Executive approved the project. Project is now ongoing.';
      } else {
        newSubStatus = 'For Revision';
        updates.sub_status = newSubStatus;
        updates.rejected_by = user.id;
        updates.rejection_reason = comments;
        actionName = 'EXECUTIVE_REJECTED';
        desc = `Executive rejected: ${comments}`;
      }

      const { data: updatedProject, error: updateError } = await supabaseWithAuth
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. Log Records
      await supabaseWithAuth.from('project_approvals').insert([{
        project_id: projectId,
        approval_stage: 'EXECUTIVE',
        approver_user_id: user.id,
        decision,
        comments,
        decided_at: new Date().toISOString()
      }]);

      await supabaseWithAuth.from('project_activity_logs').insert([{
        project_id: projectId,
        user_id: user.id,
        action: actionName,
        description: desc
      }]);

      await supabaseWithAuth.from('project_revisions').insert([{
        project_id: projectId,
        from_status: `${oldStatus}:${oldSubStatus}`,
        to_status: `${newStatus}${newSubStatus ? ':' + newSubStatus : ''}`,
        requested_by: user.id,
        comments
      }]);

      res.json({ data: updatedProject });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error processing executive approval', error: err.message });
    }
  }
}

module.exports = ProjectApprovalController;
