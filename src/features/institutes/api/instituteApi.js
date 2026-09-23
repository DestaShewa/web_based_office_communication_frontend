import apiClient from '../../../lib/axios';

/**
 * Fetches all institutes.
 * @param {Object} params - Query parameters (limit, page, search).
 */
export const getInstitutes = async (params = {}) => {
  const response = await apiClient.get('/institutes', { params });
  return response.data;
};

/**
 * Fetches a single institute by customId or _id.
 */
export const getInstituteById = async (id) => {
  const response = await apiClient.get(`/institutes/${id}`);
  return response.data;
};

/**
 * Creates a new institute.
 */
export const createInstitute = async (data) => {
  const response = await apiClient.post('/institutes', data);
  return response.data;
};

/**
 * Updates an institute.
 */
export const updateInstitute = async ({ id, data }) => {
  const response = await apiClient.patch(`/institutes/${id}`, data);
  return response.data;
};


