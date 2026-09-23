import apiClient from '../../../lib/axios';

export const createDepartment = async (data) => {
  const response = await apiClient.post('/departments', data);
  return response.data;
};

export const updateDepartment = async ({ id, data }) => {
  const response = await apiClient.patch(`/departments/${id}`, data);
  return response.data;
};

export const changeDepartmentStatus = async ({ id, isActive }) => {
  const response = await apiClient.patch(`/departments/${id}/status`, { isActive });
  return response.data;
};
