import apiClient from '../../../lib/axios';

export const getDepartments = async (params = {}) => {
  const response = await apiClient.get('/departments', { params });
  return response.data;
};
