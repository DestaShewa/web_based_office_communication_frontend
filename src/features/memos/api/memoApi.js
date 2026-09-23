import apiClient from '../../../lib/axios';

export const getInbox = async () => {
  const response = await apiClient.get('/memos/inbox');
  return response.data.data.memos;
};

export const getOutbox = async () => {
  const response = await apiClient.get('/memos/outbox');
  return response.data.data.memos;
};

export const getMemoDetails = async (memoId) => {
  const response = await apiClient.get(`/memos/${memoId}`);
  return response.data.data.memo;
};

export const createMemo = async (memoData) => {
  const config = memoData instanceof FormData 
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : {};
  const response = await apiClient.post('/memos', memoData, config);
  return response.data.data.memo;
};

export const markAsRead = async (memoId) => {
  const response = await apiClient.patch(`/memos/${memoId}/read`);
  return response.data.data.memo;
};

export const updateMemo = async (memoId, memoData) => {
  const config = memoData instanceof FormData 
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : {};
  const response = await apiClient.patch(`/memos/${memoId}`, memoData, config);
  return response.data.data.memo;
};

export const deleteMemo = async (memoId) => {
  await apiClient.delete(`/memos/${memoId}`);
  return true;
};
