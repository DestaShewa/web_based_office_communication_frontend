import apiClient from '../../../lib/axios';

/**
 * Fetches all faculties.
 * @param {Object} params - Query parameters (limit, page, search).
 */
export const getFaculties = async (params = {}) => {
  const response = await apiClient.get('/faculties', { params });
  return response.data;
};

/**
 * Fetches a single faculty by customId or _id.
 */
export const getFacultyById = async (id) => {
  const response = await apiClient.get(`/faculties/${id}`);
  return response.data;
};

/**
 * Creates a new faculty.
 */
export const createFaculty = async (data) => {
  const response = await apiClient.post('/faculties', data);
  return response.data;
};

/**
 * Updates a faculty.
 */
export const updateFaculty = async ({ id, data }) => {
  const response = await apiClient.patch(`/faculties/${id}`, data);
  return response.data;
};

/**
 * Deletes/Deactivates a faculty.
 */
export const deleteFaculty = async (id) => {
  const response = await apiClient.delete(`/faculties/${id}`);
  return response.data;
};
