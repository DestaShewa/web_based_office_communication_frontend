import apiClient from '../../../lib/axios';

export const createTask = async (data) => {
  const response = await apiClient.post('/tasks', data);
  return response.data;
};

export const updateTaskStatus = async ({ taskId, status }) => {
  const response = await apiClient.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
};

export const reassignTask = async ({ taskId, newAssigneeId }) => {
  const response = await apiClient.patch(`/tasks/${taskId}/reassign`, { newAssigneeId });
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await apiClient.delete(`/tasks/${taskId}`);
  return response.data;
};

export const addComment = async ({ taskId, message, parentCommentId }) => {
  const response = await apiClient.post(`/tasks/${taskId}/comments`, { message, parentCommentId });
  return response.data;
};

export const getTaskComments = async (taskId) => {
  const response = await apiClient.get(`/tasks/${taskId}/comments`);
  return response.data;
};

export const deleteTaskComment = async (commentId) => {
  const response = await apiClient.delete(`/tasks/comments/${commentId}`);
  return response.data;
};

export const interveneTask = async ({ taskId, dueDate, priority }) => {
  const response = await apiClient.patch(`/tasks/${taskId}/intervention`, { dueDate, priority });
  return response.data;
};
