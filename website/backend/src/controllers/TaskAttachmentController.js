const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { applyTaskVisibility } = require('../utils/visibility');

// Configure multer for memory storage (we will bounce it straight up to Supabase)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

class TaskAttachmentController {

  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static async index(req, res) {
    try {
      const supabase = TaskAttachmentController.getSupabaseWithAuth(req);
      const { task: taskId } = req.params;

      // 1. Check Task Visibility first
      let taskQuery = supabase.from('tasks').select('id').eq('id', taskId);
      taskQuery = applyTaskVisibility(taskQuery, req.user);
      const { data: isVisible } = await taskQuery.single();

      if (!isVisible) {
        return res.status(403).json({ message: 'Unauthorized. You do not have access to this task.' });
      }

      const { data: attachments, error } = await supabase
        .from('task_attachments')
        .select(`
          id,
          file_name,
          file_path,
          file_type,
          file_size,
          created_at,
          uploader:users!uploaded_by(id, first_name, last_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const bucket = process.env.SUPABASE_BUCKET_ATTACHMENTS || 'task-attachments';

      const formattedAttachments = attachments.map(a => ({
        id: a.id,
        file_name: a.file_name,
        file_type: a.file_type,
        file_size: a.file_size,
        created_at: a.created_at,
        uploader: {
          id: a.uploader.id,
          name: `${a.uploader.first_name} ${a.uploader.last_name}`
        },
        download_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${a.file_path.replace(/^\/+/, '')}`
      }));

      res.json({ data: formattedAttachments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching attachments', error: err.message });
    }
  }

  static async store(req, res) {
    try {
      const supabase = TaskAttachmentController.getSupabaseWithAuth(req);
      const { task: taskId } = req.params;
      const user = req.user;
      const files = req.files; // Populated by multer

      if (!files || files.length === 0) {
        return res.status(422).json({ message: 'No files provided.' });
      }

      const bucket = process.env.SUPABASE_BUCKET_ATTACHMENTS || 'task-attachments';
      const created = [];

      for (const file of files) {
        // Generate a pseudo-random path matching typical Laravel path behavior
        const path = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${file.originalname}`;

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) throw uploadError;

        // 2. Insert into task_attachments
        const { data: attachment, error: dbError } = await supabase
          .from('task_attachments')
          .insert([{
            task_id: taskId,
            file_name: file.originalname,
            file_path: path,
            file_type: file.mimetype,
            file_size: file.size,
            uploaded_by: user.id
          }])
          .select(`
            id,
            file_name,
            file_path,
            file_type,
            file_size,
            created_at,
            uploader:users!uploaded_by(id, first_name, last_name)
          `)
          .single();

        if (dbError) throw dbError;

        created.push({
          id: attachment.id,
          file_name: attachment.file_name,
          file_type: attachment.file_type,
          file_size: attachment.file_size,
          created_at: attachment.created_at,
          uploader: {
            id: attachment.uploader.id,
            name: `${attachment.uploader.first_name} ${attachment.uploader.last_name}`
          },
          download_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${attachment.file_path.replace(/^\/+/, '')}`
        });
      }

      // Check if task needs status bump
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single();

      if (!fetchError && task && task.status === 'todo') {
        await supabase
          .from('tasks')
          .update({ status: 'in_progress', updated_by: user.id })
          .eq('id', taskId);
      }

      res.status(201).json({ data: created });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error uploading attachments', error: err.message });
    }
  }

  static async download(req, res) {
    try {
      const supabase = TaskAttachmentController.getSupabaseWithAuth(req);
      const { task: taskId, attachment: attachmentId } = req.params;

      const { data: attachment, error } = await supabase
        .from('task_attachments')
        .select('file_path, task_id')
        .eq('id', attachmentId)
        .single();

      if (error || !attachment || attachment.task_id != taskId) {
        return res.status(404).json({ message: 'Attachment not found.' });
      }

      const bucket = process.env.SUPABASE_BUCKET_ATTACHMENTS || 'task-attachments';
      const downloadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${attachment.file_path.replace(/^\/+/, '')}`;

      res.redirect(downloadUrl);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error triggering download', error: err.message });
    }
  }
}

module.exports = {
  TaskAttachmentController,
  uploadMiddleware: upload.array('files')
};
