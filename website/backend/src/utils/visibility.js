/**
 * Utility to apply role-based visibility filters to Supabase queries.
 * Matches the BuildSphere visibility matrix.
 */

const FULL_ACCESS_ROLES = ['CEO', 'COO', 'HR', 'Admin'];

/**
 * Helper to fetch all project IDs where the user is a team member.
 */
async function getMemberProjectIds(supabaseClient, userId) {
  try {
    const { data: memberRows, error } = await supabaseClient
      .from('project_user')
      .select('project_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (memberRows || []).map(r => r.project_id);
  } catch (err) {
    console.error('Error fetching member project IDs:', err);
    return [];
  }
}

/**
 * Helper to fetch all project IDs related to a user (created, PIC, or team member).
 */
async function getAllVisibleProjectIds(supabaseClient, user) {
  if (!user) return [];
  try {
    const memberProjectIds = await getMemberProjectIds(supabaseClient, user.id);
    const { data: roleProjRows, error } = await supabaseClient
      .from('projects')
      .select('id')
      .or(`created_by.eq.${user.id},project_in_charge_id.eq.${user.id}`);

    if (error) throw error;
    const roleProjectIds = (roleProjRows || []).map(r => r.id);
    return Array.from(new Set([...memberProjectIds, ...roleProjectIds]));
  } catch (err) {
    console.error('Error fetching all visible project IDs:', err);
    return [];
  }
}

/**
 * Helper to fetch all project IDs created by a sales user.
 */
async function getSalesProjectIds(supabaseClient, userId) {
  try {
    const { data: projRows, error } = await supabaseClient
      .from('projects')
      .select('id')
      .eq('created_by', userId);

    if (error) throw error;
    return (projRows || []).map(r => r.id);
  } catch (err) {
    console.error('Error fetching sales project IDs:', err);
    return [];
  }
}

/**
 * Applies visibility filters to a query targeting the 'projects' table (synchronously).
 */
function applyProjectVisibility(query, user, memberProjectIds = []) {
  if (!user) return query;

  const role = user.role; // Case-sensitive check against DB values

  // 1. Full Access Roles
  if (FULL_ACCESS_ROLES.includes(role)) {
    return query;
  }

  // 2. Accounting: Full access but hide 'draft' projects
  if (role === 'Accounting') {
    return query.neq('sub_status', 'draft');
  }

  // 3. Sales: Only projects they created
  if (role === 'Sales') {
    return query.eq('created_by', user.id);
  }

  // 4. Project Engineer, Project Coordinator & Others: Only projects they created, PIC, or are members of
  if (memberProjectIds.length > 0) {
    return query.or(`created_by.eq.${user.id},project_in_charge_id.eq.${user.id},id.in.(${memberProjectIds.join(',')})`);
  } else {
    return query.or(`created_by.eq.${user.id},project_in_charge_id.eq.${user.id}`);
  }
}

/**
 * Applies visibility filters to a query targeting the 'tasks' table (synchronously).
 */
function applyTaskVisibility(query, user, allVisibleProjectIds = [], salesProjectIds = []) {
  if (!user) return query;

  const role = user.role;

  // 1. Full Access Roles (including Accounting for tasks)
  if (FULL_ACCESS_ROLES.includes(role) || role === 'Accounting') {
    return query;
  }

  // 2. Sales: Tasks in projects they created
  if (role === 'Sales') {
    if (salesProjectIds.length > 0) {
      return query.in('project_id', salesProjectIds);
    } else {
      return query.eq('id', -1);
    }
  }

  // 3. Project Engineer, Project Coordinator & Others: Tasks in projects they created, are PIC of, or are team members, or assigned directly to the user
  if (allVisibleProjectIds.length > 0) {
    return query.or(`assigned_to.eq.${user.id},project_id.in.(${allVisibleProjectIds.join(',')})`);
  } else {
    return query.eq('assigned_to', user.id);
  }
}

module.exports = { 
  applyProjectVisibility, 
  applyTaskVisibility,
  getMemberProjectIds,
  getAllVisibleProjectIds,
  getSalesProjectIds
};
