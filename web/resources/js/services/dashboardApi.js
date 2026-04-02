import api from './api';

const BASE = '/dashboard';

export const getDashboardStats = () =>
    api.get(`${BASE}/stats`).then(r => r.data);
