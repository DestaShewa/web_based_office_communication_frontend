import apiClient from '../../../lib/axios';

export const getSystemOverview = async () => {
  const response = await apiClient.get('/reports/overview');
  return response.data;
};

export const getTaskAnalytics = async () => {
  const response = await apiClient.get('/reports/tasks');
  return response.data;
};


export const getRecentAuditLogs = async () => {
  const response = await apiClient.get('/audit', { params: { limit: 7, page: 1 } });
  return response.data;
};

export const getRecentAnnouncements = async () => {
  const response = await apiClient.get('/announcements', { params: { limit: 5 } });
  return response.data;
};

export const getUpcomingMeetings = async () => {
  const response = await apiClient.get('/meetings/me', { params: { limit: 5 } });
  return response.data;
};
