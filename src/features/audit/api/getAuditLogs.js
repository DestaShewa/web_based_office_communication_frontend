import apiClient from '../../../lib/axios';

export const getAuditLogs = async (params = {}) => {
  const response = await apiClient.get('/audit', { params });
  return response.data;
};
