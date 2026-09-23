import apiClient from '../../../lib/axios';

export const searchUsersByNameOrUsername = async (query) => {
  if (!query) return [];
  const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}&limit=10`);
  return response.data?.data?.users || [];
};
