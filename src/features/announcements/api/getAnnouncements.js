import apiClient from '../../../lib/axios';

export const getMyAnnouncements = async (params = {}) => {
  const response = await apiClient.get('/announcements', { params });
  return response.data;
};

export const getAllAnnouncementsAdmin = async (params = {}) => {
  const response = await apiClient.get('/announcements/admin/all', { params });
  return response.data;
};

export const getAnnouncementReadStatus = async (id) => {
  const response = await apiClient.get(`/announcements/${id}/read-status`);
  return response.data;
};
