import apiClient from '../../../lib/axios';

/**
 * Fetches all faculties.
 * @param {Object} params - Query parameters (limit, page, search).
 * @returns {Promise<Object>} - API response.
 */
export const getFaculties = async (params = {}) => {
  const response = await apiClient.get('/faculties', { params });
  return response.data;
};

/**
 * Fetches a single faculty by customId.
 */
export const getFacultyByCustomId = async (id) => {
  const response = await apiClient.get(`/faculties/${id}`);
  return response.data;
};
