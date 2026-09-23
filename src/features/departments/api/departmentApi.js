import apiClient from '../../../lib/axios';

export const getDepartmentMembers = async (departmentId) => {
  if (!departmentId) return { members: [], total: 0 };
  const response = await apiClient.get(`/departments/${departmentId}/members`);
  return response.data?.data || { members: [], total: 0 };
};
