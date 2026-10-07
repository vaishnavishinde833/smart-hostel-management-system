import api from './axios';

export const getLeaveRequests    = ()        => api.get('/leave-requests');
export const getLeaveRequestById = (id)      => api.get(`/leave-requests/${id}`);
export const createLeaveRequest  = (data)    => api.post('/leave-requests', data);
export const approveLeaveRequest = (id, data) => api.patch(`/leave-requests/${id}/approve`, data ?? {});
export const rejectLeaveRequest  = (id, data) => api.patch(`/leave-requests/${id}/reject`,  data ?? {});
