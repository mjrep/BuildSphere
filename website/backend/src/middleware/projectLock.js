const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Middleware to prevent modifications to completed projects.
 * @param {string} paramName The name of the route parameter containing the project ID.
 */
const projectLock = (paramName = 'id') => async (req, res, next) => {
    // 1. Only block mutation methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // 2. Explicitly allow the 'complete' endpoint to bypass the lock
    if (req.path.endsWith('/complete')) {
        return next();
    }

    try {
        // 3. Resolve project ID from params or body
        const projectId = req.params[paramName] || req.params.project || req.body.project_id || req.body.id;
        
        if (!projectId) {
            return next();
        }

        // 4. Fetch status from Supabase
        // Use the token from request if available for RLS, or admin if needed
        const token = req.cookies?.['sb-access-token'];
        const client = token 
            ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
                global: { headers: { Authorization: `Bearer ${token}` } }
              })
            : supabase;

        const { data: project, error } = await client
            .from('projects')
            .select('status')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            // If project not found, let the controller handle the 404
            return next();
        }

        // 5. Enforce the lock
        if (project.status === 'completed') {
            return res.status(403).json({ 
                message: 'Action Forbidden: This project is marked as completed and is now read-only.',
                error: 'project_locked'
            });
        }

        next();
    } catch (err) {
        console.error('Project Lock Middleware Error:', err);
        next(); // Proceed if middleware fails to avoid blocking valid requests
    }
};

module.exports = projectLock;
