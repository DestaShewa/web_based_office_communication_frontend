import apiClient from '../../../lib/axios';

export const createAnnouncement = async (data) => {
  const response = await apiClient.post('/announcements', data, {
    headers: {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  });
  return response.data;
};

export const acknowledgeAnnouncement = async (id) => {
  const response = await apiClient.patch(`/announcements/${id}/acknowledge`);
  return response.data;
};

export const updateAnnouncement = async ({ id, data }) => {
  const response = await apiClient.patch(`/announcements/${id}`, data, {
    headers: {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  });
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await apiClient.delete(`/announcements/${id}`);
  return response.data;
};

export const hideAnnouncement = async (id) => {
  const response = await apiClient.delete(`/announcements/${id}/hide`);
  return response.data;
};
