import api from './axios';

export const getStudents    = ()     => api.get('/students');
export const getStudentById = (id)   => api.get(`/students/${id}`);
export const createStudent  = (data) => api.post('/students', data);
export const updateStudent  = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent  = (id)   => api.delete(`/students/${id}`);
export const deactivateStudent = (id) => api.patch(`/students/${id}/deactivate`);
export const activateStudent   = (id) => api.patch(`/students/${id}/activate`);
