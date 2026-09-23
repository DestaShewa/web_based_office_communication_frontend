import apiClient from '../../../lib/axios';

export const getTasks = async (params = {}) => {
  const response = await apiClient.get('/tasks', { params });
  return response.data;
};

export const getMyTasks = async (params = {}) => {
  const response = await apiClient.get('/tasks/me', { params });
  return response.data;
};

export const getDepartmentTasks = async (deptId, params = {}) => {
  const response = await apiClient.get(`/tasks/department/${deptId}`, { params });
  return response.data;
};

export const getFacultyTasks = async (facultyId, params = {}) => {
  const response = await apiClient.get(`/tasks/faculty/${facultyId}`, { params });
  return response.data;
};

export const getAssignedByMeTasks = async (params = {}) => {
  const response = await apiClient.get('/tasks/assigned-by-me', { params });
  return response.data;
};

export const getMembersTasks = async (params = {}) => {
  const response = await apiClient.get('/tasks/members', { params });
  return response.data;
};

