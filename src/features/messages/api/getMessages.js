import apiClient from '../../../lib/axios';

export const getConversations = async () => {
  const response = await apiClient.get('/messages/conversations');
  return response.data;
};

export const getChatHistory = async (userId, params = {}) => {
  const response = await apiClient.get(`/messages/history/${userId}`, { params });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await apiClient.get('/messages/unread/count');
  return response.data;
};

export const getGroups = async () => {
  const response = await apiClient.get('/messages/groups');
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await apiClient.post('/messages/groups', groupData);
  return response.data;
};

export const getGroupChatHistory = async (groupId, params = {}) => {
  const response = await apiClient.get(`/messages/group/${groupId}`, { params });
  return response.data;
};
