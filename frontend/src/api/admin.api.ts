import { apiClient } from './client';

export const adminApi = {
  getAnalytics: async () => {
    const res = await apiClient.get('/admin/analytics');
    return res.data;
  },
  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },
  adjustCredits: async (userId: string, data: { amount: number; reason: string }) => {
    const res = await apiClient.post(`/admin/users/${userId}/credits`, data);
    return res.data;
  },
  updateUserStatus: async (userId: string, data: { status: 'ACTIVE' | 'SUSPENDED'; reason?: string }) => {
    const res = await apiClient.post(`/admin/users/${userId}/status`, data);
    return res.data;
  },
  getJobs: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await apiClient.get('/admin/jobs', { params });
    return res.data;
  },
  getAuditLogs: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data;
  },
};
