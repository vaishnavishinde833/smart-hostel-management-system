import api from './axios';

export const getAllocations        = ()     => api.get('/allocations');
export const getAllocationById     = (id)   => api.get(`/allocations/${id}`);
export const getStudentAllocations = (studentId) => api.get(`/allocations/student/${studentId}`);
export const createAllocation      = (data) => api.post('/allocations', data);
export const vacateAllocation      = (id)   => api.patch(`/allocations/${id}/vacate`);
