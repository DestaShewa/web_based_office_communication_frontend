import apiClient from '../../../lib/axios';

export const createUser = async (data) => {
  const response = await apiClient.post('/users', data);
  return response.data;
};

export const updateUser = async ({ id, data }) => {
  const response = await apiClient.patch(`/users/${id}`, data);
  return response.data;
};

export const updateUserRole = async ({ id, role }) => {
  const response = await apiClient.patch(`/users/${id}/role`, { role });
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};

export const deleteUserPermanently = async (id) => {
  const response = await apiClient.delete(`/users/${id}/permanent`);
  return response.data;
};

export const activateUser = async (id) => {
  const response = await apiClient.patch(`/users/${id}/activate`);
  return response.data;
};

export const resetUserPassword = async (id) => {
  const response = await apiClient.patch(`/users/${id}/reset-password`);
  return response.data;
};

// --- Personal Profile Mutations ---

export const updateMe = async (data) => {
  const response = await apiClient.patch('/users/update-me', data);
  return response.data;
};

export const updateStatus = async (status) => {
  const response = await apiClient.patch('/users/status', { status });
  return response.data;
};

export const uploadProfilePhoto = async (formData) => {
  const response = await apiClient.post('/users/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const requestEmailChange = async (newEmail) => {
  const response = await apiClient.post('/users/request-email-change', { newEmail });
  return response.data;
};

export const verifyEmailChange = async (otp) => {
  const response = await apiClient.post('/users/verify-email-change', { otp });
  return response.data;
};
