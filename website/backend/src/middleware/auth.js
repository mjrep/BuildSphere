const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Middleware to authenticate requests using Supabase JWT token from cookies.
 */
const authenticateToken = async (req, res, next) => {
  if (!supabase) return res.status(500).json({ message: 'Supabase client not initialized' });

  const token = req.cookies?.['sb-access-token'];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(403).json({ message: 'Invalid or expired token', error: authError?.message });
    }

    // Attach user record from public users table to req.user
    // We match by email because Supabase Auth uses UUIDs but our public table uses legacy Integers
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('email', authData.user.email)
      .single();

    // 1. ID Consistency: Ensure we use the integer ID from public members table
    // 2. Role Integrity: Keep original casing but allow helpers to check
    const baseUser = userData || authData.user;
    
    if (!userData && authData.user.user_metadata) {
      Object.assign(baseUser, authData.user.user_metadata);
    }

    req.user = baseUser;
    next();
  } catch (err) {
    console.error('Middleware authentication error:', err);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = authenticateToken;
