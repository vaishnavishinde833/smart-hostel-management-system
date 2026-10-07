import api from './axios';

export const getComplaints       = ()     => api.get('/complaints');
export const getComplaintById    = (id)   => api.get(`/complaints/${id}`);
export const createComplaint     = (data) => api.post('/complaints', data);
export const updateComplaintStatus = (id, data) => api.patch(`/complaints/${id}/status`, data);
