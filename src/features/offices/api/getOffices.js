import axios from '../../../lib/axios';

/**
 * Fetch all standalone offices with filtering and pagination
 */
export const getOffices = async ({ page = 1, limit = 100, search = '' } = {}) => {
  const params = { page, limit, search };
  const response = await axios.get('/offices', { params });
  return response.data;
};
