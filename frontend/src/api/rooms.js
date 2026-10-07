import api from './axios';

export const getRooms          = (params) => api.get('/rooms', { params });
export const getAvailableRooms = (params) => api.get('/rooms/available', { params });
export const getRoomsByHostel  = (hostelId) => api.get(`/rooms/hostel/${hostelId}`);
export const getRoomById       = (id)   => api.get(`/rooms/${id}`);
export const createRoom        = (data) => api.post('/rooms', data);
export const updateRoom        = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom        = (id)   => api.delete(`/rooms/${id}`);
