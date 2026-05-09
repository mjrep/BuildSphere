const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

class ProjectFileController {

  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static async index(req, res) {
    try {
      const supabase = ProjectFileController.getSupabaseWithAuth(req);
      const { id: projectId } = req.params;

      const { data: files, error } = await supabase
        .from('project_files')
        .select(`
          id,
          file_name,
          file_path,
          file_type,
          file_size,
          created_at,
          uploader:users!uploaded_by(id, first_name, last_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bucket = process.env.SUPABASE_BUCKET_PROJECT_FILES || 'project-files';

      const formatted = (files || []).map(f => ({
        id: f.id,
        file_name: f.file_name,
        file_type: f.file_type,
        file_size: f.file_size,
        created_at: f.created_at,
        uploaded_by: f.uploader ? `${f.uploader.first_name} ${f.uploader.last_name}` : 'Unknown',
        download_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${f.file_path.replace(/^\/+/, '')}`
      }));

      res.json({ data: formatted });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching project files', error: err.message });
    }
  }

  static async store(req, res) {
    try {
      const supabase = ProjectFileController.getSupabaseWithAuth(req);
      const { id: projectId } = req.params;
      const user = req.user;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(422).json({ message: 'No files provided.' });
      }

      const bucket = process.env.SUPABASE_BUCKET_PROJECT_FILES || 'project-files';
      const created = [];

      for (const file of files) {
        const path = `prj_${projectId}/${Date.now()}_${file.originalname}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
             // If bucket doesn't exist, this might fail. We assume bucket exists.
             throw uploadError;
        }

        // 2. DB Record
        const { data: dbFile, error: dbError } = await supabase
          .from('project_files')
          .insert([{
            project_id: projectId,
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
          id: dbFile.id,
          file_name: dbFile.file_name,
          file_type: dbFile.file_type,
          file_size: dbFile.file_size,
          created_at: dbFile.created_at,
          uploaded_by: `${dbFile.uploader.first_name} ${dbFile.uploader.last_name}`,
          download_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${dbFile.file_path.replace(/^\/+/, '')}`
        });
      }

      res.status(201).json({ data: created });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error uploading files', error: err.message });
    }
  }

  static async destroy(req, res) {
    try {
      const supabase = ProjectFileController.getSupabaseWithAuth(req);
      const { id: projectId, file: fileId } = req.params;

      const { data: file, error: fetchErr } = await supabase
        .from('project_files')
        .select('file_path')
        .eq('id', fileId)
        .eq('project_id', projectId)
        .single();

      if (fetchErr || !file) return res.status(404).json({ message: 'File not found' });

      const bucket = process.env.SUPABASE_BUCKET_PROJECT_FILES || 'project-files';
      
      // 1. Storage delete
      await supabase.storage.from(bucket).remove([file.file_path]);

      // 2. DB delete
      await supabase.from('project_files').delete().eq('id', fileId);

      res.json({ message: 'File deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting file' });
    }
  }
}

module.exports = {
  ProjectFileController,
  projectFileUploadMiddleware: upload.array('files')
};
