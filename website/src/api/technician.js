import api from './axios';

const BASE = '/technician';

export const technicianApi = {
  // Dashboard & Profile
  getDashboard: () => api.get(`${BASE}/dashboard/`),
  getProfile: () => api.get(`${BASE}/profile/`),
  updateProfile: (data) => api.patch(`${BASE}/profile/`, data),

  // Jobs
  getJobs: (params = {}) => api.get(`${BASE}/jobs/`, { params }),
  getJob: (jobNumber) => api.get(`${BASE}/jobs/${jobNumber}/`),
  updateJobStatus: (jobNumber, data) => api.patch(`${BASE}/jobs/${jobNumber}/status/`, data),
  addJobNote: (jobNumber, data) => api.post(`${BASE}/jobs/${jobNumber}/notes/`, data),
  uploadJobPhoto: (jobNumber, formData) =>
    api.post(`${BASE}/jobs/${jobNumber}/photos/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Schedule
  getSchedule: (params = {}) => api.get(`${BASE}/schedule/`, { params }),
  createScheduleEntry: (data) => api.post(`${BASE}/schedule/create/`, data),
  deleteScheduleEntry: (id) => api.delete(`${BASE}/schedule/${id}/delete/`),
};
