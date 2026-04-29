import api from './api';

/**
 * Generates a compiled report based on scope, type, and date range.
 * @param {Object} data { projectId, type, startDate, endDate, includeMilestones, includeFinancials, includePhotos }
 */
export const generateReport = (data) => 
    api.post('/reports/generate', data);

/**
 * Fetches historical reports (optional addition for scalability)
 */
export const getReports = (params = {}) => 
    api.get('/reports', { params });
