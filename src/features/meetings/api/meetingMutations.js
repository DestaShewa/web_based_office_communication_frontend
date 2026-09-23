import apiClient from '../../../lib/axios';

export const scheduleMeeting = async (data) => {
  const response = await apiClient.post('/meetings', data);
  return response.data;
};

export const updateMeetingStatus = async ({ id, status }) => {
  const response = await apiClient.patch(`/meetings/${id}/status`, { status });
  return response.data;
};

