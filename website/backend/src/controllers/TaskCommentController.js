const { createClient } = require('@supabase/supabase-js');
const NotificationService = require('../services/NotificationService');
const { applyTaskVisibility, getAllVisibleProjectIds, getSalesProjectIds } = require('../utils/visibility');

class TaskCommentController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static async index(req, res) {
    try {
      const supabase = TaskCommentController.getSupabaseWithAuth(req);
      const { task: taskId } = req.params;

      // 1. Check Task Visibility first
      const allVisibleProjectIds = await getAllVisibleProjectIds(supabase, req.user);
      let salesProjectIds = [];
      if (req.user.role === 'Sales') {
        salesProjectIds = await getSalesProjectIds(supabase, req.user.id);
      }
      taskQuery = applyTaskVisibility(taskQuery, req.user, allVisibleProjectIds, salesProjectIds);
      const { data: isVisible } = await taskQuery.single();

      if (!isVisible) {
        return res.status(403).json({ message: 'Unauthorized. You do not have access to this task.' });
      }

      const { data: comments, error } = await supabase
        .from('task_comments')
        .select(`
          id,
          comment,
          created_at,
          user:users(id, first_name, last_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Format to camelCase natively expected by frontend
      const formattedComments = comments.map(c => ({
        id: c.id,
        comment: c.comment,
        created_at: c.created_at,
        user: {
          id: c.user.id,
          name: `${c.user.first_name} ${c.user.last_name}`
        }
      }));

      res.json({ data: formattedComments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching comments', error: err.message });
    }
  }

  static async store(req, res) {
    try {
      const supabase = TaskCommentController.getSupabaseWithAuth(req);
      const { task: taskId } = req.params;
      const { comment } = req.body;
      const user = req.user;

      if (!comment) return res.status(422).json({ message: 'Comment text is required.' });

      const { data: newComment, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          comment
        }])
        .select(`
          id,
          comment,
          created_at,
          user:users(id, first_name, last_name)
        `)
        .single();

      if (error) throw error;

      // --- Notification Trigger: User Mentions ---
      const { mentioned_user_ids } = req.body;
      if (mentioned_user_ids && Array.isArray(mentioned_user_ids)) {
        try {
          const { data: task } = await supabase
            .from('tasks')
            .select('title')
            .eq('id', taskId)
            .single();

          for (const mentionedId of mentioned_user_ids) {
            await NotificationService.createNotification(
              mentionedId,
              'You were mentioned',
              `${user.first_name} ${user.last_name} mentioned you in a comment on ${task?.title || 'Task'}.`,
              'info',
              `/tasks`
            );
          }
        } catch (notifErr) {
          console.error('Mention Notification Error:', notifErr);
        }
      }

      res.status(201).json({
        id: newComment.id,
        comment: newComment.comment,
        created_at: newComment.created_at,
        user: {
          id: newComment.user.id,
          name: `${newComment.user.first_name} ${newComment.user.last_name}`
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error posting comment', error: err.message });
    }
  }
}

module.exports = TaskCommentController;
