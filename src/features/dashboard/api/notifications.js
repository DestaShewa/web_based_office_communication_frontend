import apiClient from '../../../lib/axios';

export const getMyNotifications = async ({ limit = 20, page = 1 } = {}) => {
  const response = await apiClient.get('/notifications/', { params: { limit, page } });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await apiClient.get('/notifications/unread/count');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
};

