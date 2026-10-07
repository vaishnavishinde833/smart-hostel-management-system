import api from './axios';

export const getNotices    = ()        => api.get('/notices');
export const getNoticeById = (id)      => api.get(`/notices/${id}`);
export const createNotice  = (data)    => api.post('/notices', data);
export const updateNotice  = (id, data) => api.put(`/notices/${id}`, data);
export const deleteNotice  = (id)      => api.delete(`/notices/${id}`);
