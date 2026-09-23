import apiClient from '../../../lib/axios';

export const getSettings = async () => {
  const response = await apiClient.get('/system-configs');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await apiClient.patch('/system-configs', data);
  return response.data;
};
