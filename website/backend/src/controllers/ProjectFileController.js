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

  static getSupabaseAdmin() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  /**
   * Ensures the storage bucket exists, creating it if missing.
   * Uses the service-role admin client since regular users can't create buckets.
   */
  static async ensureBucketExists(bucketName) {
    const admin = ProjectFileController.getSupabaseAdmin();
    const { data, error } = await admin.storage.getBucket(bucketName);

    if (error && (error.message?.includes('not found') || error.statusCode === '404' || error.status === 400)) {
      console.log(`[ProjectFileController] Bucket "${bucketName}" not found. Creating...`);
      const { error: createError } = await admin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
      });
      if (createError) {
        console.error(`[ProjectFileController] Failed to create bucket "${bucketName}":`, createError);
        throw createError;
      }
      console.log(`[ProjectFileController] Bucket "${bucketName}" created successfully.`);
    } else if (error) {
      throw error;
    }
  }

  static async index(req, res) {
    try {
      const supabase = ProjectFileController.getSupabaseAdmin();
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
      const supabaseAdmin = ProjectFileController.getSupabaseAdmin();
      const { id: projectId } = req.params;
      const user = req.user;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(422).json({ message: 'No files provided.' });
      }

      const bucket = process.env.SUPABASE_BUCKET_PROJECT_FILES || 'project-files';
      
      // Auto-create bucket if it doesn't exist
      await ProjectFileController.ensureBucketExists(bucket);
      
      const created = [];

      for (const file of files) {
        const path = `prj_${projectId}/${Date.now()}_${file.originalname}`;

        // 1. Upload to Storage (use admin client to bypass RLS)
        const { error: uploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
             throw uploadError;
        }

        // 2. DB Record (use admin client to bypass RLS on project_files table too)
        const { data: dbFile, error: dbError } = await supabaseAdmin
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
          uploaded_by: dbFile.uploader ? `${dbFile.uploader.first_name} ${dbFile.uploader.last_name}` : 'Unknown',
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
      const supabaseAdmin = ProjectFileController.getSupabaseAdmin();
      const { id: projectId, file: fileId } = req.params;

      const { data: file, error: fetchErr } = await supabaseAdmin
        .from('project_files')
        .select('file_path')
        .eq('id', fileId)
        .eq('project_id', projectId)
        .single();

      if (fetchErr || !file) return res.status(404).json({ message: 'File not found' });

      const bucket = process.env.SUPABASE_BUCKET_PROJECT_FILES || 'project-files';
      
      // 1. Storage delete (admin bypasses RLS)
      await supabaseAdmin.storage.from(bucket).remove([file.file_path]);

      // 2. DB delete
      await supabaseAdmin.from('project_files').delete().eq('id', fileId);

      res.json({ message: 'File deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error deleting file' });
    }
  }
}

module.exports = {
  ProjectFileController,
  projectFileUploadMiddleware: upload.array('files')
};
