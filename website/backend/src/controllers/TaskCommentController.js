const { createClient } = require('@supabase/supabase-js');

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
