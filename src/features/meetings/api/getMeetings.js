import apiClient from '../../../lib/axios';

export const getMyMeetings = async (params = {}) => {
  const response = await apiClient.get('/meetings/me', { params });
  return response.data;
};

export const getDepartmentMeetings = async (deptId, params = {}) => {
  const response = await apiClient.get(`/meetings/department/${deptId}`, { params });
  return response.data;
};

export const getFacultyMeetings = async (facultyId, params = {}) => {
  const response = await apiClient.get(`/meetings/faculty/${facultyId}`, { params });
  return response.data;
};

export const getAllMeetings = async (params = {}) => {
  const response = await apiClient.get('/meetings', { params });
  return response.data;
};

export const getOfficeMeetings = async (officeId, params = {}) => {
  const response = await apiClient.get(`/meetings/office/${officeId}`, { params });
  return response.data;
};

export const getUniversityMeetings = async (params = {}) => {
  const response = await apiClient.get('/meetings/university', { params });
  return response.data;
};

