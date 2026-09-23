import axios from '../../../lib/axios';

/**
 * Create a new standalone office
 */
export const createOffice = async (officeData) => {
  const response = await axios.post('/offices', officeData);
  return response.data;
};

/**
 * Update an existing office
 */
export const updateOffice = async ({ id, ...officeData }) => {
  const response = await axios.patch(`/offices/${id}`, officeData);
  return response.data;
};

/**
 * Toggle office status (Active/Inactive)
 */
export const changeOfficeStatus = async ({ id, isActive }) => {
  const response = await axios.patch(`/offices/${id}`, { isActive });
  return response.data;
};

/**
 * Permanently delete an office
 */
export const deleteOffice = async (id) => {
  const response = await axios.delete(`/offices/${id}`);
  return response.data;
};
