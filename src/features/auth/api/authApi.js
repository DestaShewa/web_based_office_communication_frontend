import apiClient from '../../../lib/axios';

/**
 * Logs in the user and returns the payload containing JWT token and user profile
 */
export const loginRequest = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Changes the current user's password
 */
export const changePasswordRequest = async ({ currentPassword, newPassword }) => {
  const response = await apiClient.patch('/auth/change-password', { 
    currentPassword, 
    newPassword 
  });
  return response.data;
};
