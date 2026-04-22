class TaskQueryService {
  /**
   * Build a base query with all eager loads for list/kanban view, enforcing visibility.
   */
  static applyBaseQuery(query, user) {
    const role = (user?.role || '').toLowerCase().replace(' ', '_');
    
    // Add relation selections
    let baseQuery = query.select(`
      *,
      project:projects(id, project_name),
      phase:project_phases(id, phase_key),
      milestone:project_milestones(id, milestone_name, has_quantity, target_quantity, current_quantity, unit_of_measure),
      assignedBy:users!assigned_by(id, first_name, last_name),
      assignedTo:users!assigned_to(id, first_name, last_name),
      creator:users!created_by(id, first_name, last_name)
    `, { count: 'exact' });

    // Enforce visibility
    // Management and back-office roles see all tasks
    const hasFullVisibility = ['ceo', 'coo', 'sales', 'accounting', 'procurement'].includes(role);
    
    if (!hasFullVisibility) {
      // Others see tasks assigned to them, created by them, or matching their department role
      // We also include null department_role tasks as 'general' or 'unassigned' visibility
      baseQuery = baseQuery.or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id},department_role.eq.${role},department_role.is.null`);
    }

    return baseQuery;
  }

  /**
   * Apply all supported filters to a query builder.
   */
  static applyFilters(query, params) {
    let filteredQuery = query;

    if (params.search) {
      const term = params.search;
      // PostgREST doesn't easily support OR across joined tables in standard SDK queries, 
      // so we search title and description natively
      filteredQuery = filteredQuery.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    if (params.project_id) {
      filteredQuery = filteredQuery.eq('project_id', params.project_id);
    }
    if (params.assigned_to) {
      filteredQuery = filteredQuery.eq('assigned_to', params.assigned_to);
    }
    if (params.created_by) {
      filteredQuery = filteredQuery.eq('created_by', params.created_by);
    }
    if (params.priority) {
      filteredQuery = filteredQuery.eq('priority', params.priority);
    }
    if (params.status) {
      filteredQuery = filteredQuery.eq('status', params.status.toLowerCase());
    }
    if (params.start_date) {
      filteredQuery = filteredQuery.gte('due_date', params.start_date);
    }
    if (params.end_date) {
      filteredQuery = filteredQuery.lte('due_date', params.end_date);
    }

    return filteredQuery;
  }

  /**
   * Apply sort order to a query.
   */
  static applySort(query, sortParam) {
    switch (sortParam) {
      case 'oldest':
        return query.order('created_at', { ascending: true });
      case 'due_date_asc':
        return query.order('due_date', { ascending: true });
      case 'due_date_desc':
        return query.order('due_date', { ascending: false });
      case 'priority_asc':
        // Supabase doesn't support custom CASE sorting out of the box in SDK, 
        // we fallback to alphabetical or rely on frontend sort for custom enums
        return query.order('priority', { ascending: true });
      case 'priority_desc':
        return query.order('priority', { ascending: false });
      case 'status':
        return query.order('status', { ascending: true });
      default:
        return query.order('created_at', { ascending: false }); // newest
    }
  }
}

module.exports = TaskQueryService;
