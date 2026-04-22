/**
 * Utility to apply role-based visibility filters to Supabase queries.
 * Matches the BuildSphere visibility matrix.
 */

const FULL_ACCESS_ROLES = ['CEO', 'COO', 'Accounting', 'HR', 'Admin'];

/**
 * Applies visibility filters to a query targeting the 'projects' table.
 */
function applyProjectVisibility(query, user) {
  if (!user) return query;

  const role = user.role; // Case-sensitive check against DB values

  // 1. Full Access Roles
  if (FULL_ACCESS_ROLES.includes(role)) {
    return query;
  }

  // 2. Sales: Only projects they created
  if (role === 'Sales') {
    return query.eq('created_by', user.id);
  }

  // 3. Project Engineer: Only projects they are in charge of
  if (role === 'Project Engineer') {
    return query.eq('project_in_charge_id', user.id);
  }

  // 4. Others (Coordinator, Foreman, etc.): Only projects where they are members
  return query.or(`created_by.eq.${user.id},project_in_charge_id.eq.${user.id},project_user(user_id).eq.${user.id}`);
}

/**
 * Applies visibility filters to a query targeting the 'tasks' table.
 * Tasks are visible if the user has access to the parent project.
 */
function applyTaskVisibility(query, user) {
  if (!user) return query;

  const role = user.role;

  // 1. Full Access Roles
  if (FULL_ACCESS_ROLES.includes(role)) {
    return query;
  }

  // 2. Sales: Tasks in projects they created
  if (role === 'Sales') {
    return query.filter('project.created_by', 'eq', user.id);
  }

  // 3. Project Engineer: Tasks in projects they are in charge of
  if (role === 'Project Engineer') {
    return query.filter('project.project_in_charge_id', 'eq', user.id);
  }

  // 4. Others: Tasks in projects where they are members or assigned to the task specifically
  // For tasks, we also allow seeing tasks directly assigned to the user regardless of project membership.
  return query.or(`assigned_to.eq.${user.id},project.created_by.eq.${user.id},project.project_in_charge_id.eq.${user.id},project.project_user(user_id).eq.${user.id}`);
}

module.exports = { applyProjectVisibility, applyTaskVisibility };
