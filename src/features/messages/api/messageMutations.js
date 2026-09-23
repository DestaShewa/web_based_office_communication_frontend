import apiClient from '../../../lib/axios';

export const sendMessage = async (data) => {
  return null; 
};

export const sendVoiceMessage = async (formData) => {
  const response = await apiClient.post('/messages/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const markAsRead = async (userId) => {
  if (!userId) return;
  const response = await apiClient.patch(`/messages/${userId}/read`);
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const response = await apiClient.delete(`/messages/groups/${groupId}`);
  return response.data;
};

export const removeGroupMember = async (groupId, memberId) => {
  const response = await apiClient.delete(`/messages/groups/${groupId}/members/${memberId}`);
  return response.data;
};

export const addGroupMembers = async (groupId, memberIds) => {
  const response = await apiClient.post(`/messages/groups/${groupId}/members`, { memberIds });
  return response.data;
};

export const updateGroupPhoto = async (groupId, formData) => {
  const response = await apiClient.patch(`/messages/groups/${groupId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
