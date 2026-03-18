import api from './axios';

const BASE = '/courses';

export const coursesApi = {
  // Public — Catalog
  getCourses: (params = {}) => api.get(`${BASE}/`, { params }),
  getCourse: (slug) => api.get(`${BASE}/${slug}/`),
  getCategories: () => api.get(`${BASE}/categories/`),
  getReviews: (slug, params = {}) => api.get(`${BASE}/${slug}/reviews/`, { params }),
  verifyCertificate: (code) => api.get(`${BASE}/certificates/verify/${code}/`),

  // Authenticated — Enrollment
  enroll: (slug) => api.post(`${BASE}/${slug}/enroll/`),
  getMyEnrollments: (params = {}) => api.get(`${BASE}/my/enrollments/`, { params }),
  getMyCertificates: () => api.get(`${BASE}/my/certificates/`),

  // Authenticated — Learning
  getEnrollment: (enrollmentId) => api.get(`${BASE}/enrollments/${enrollmentId}/`),
  getLessonContent: (enrollmentId, lessonId) =>
    api.get(`${BASE}/enrollments/${enrollmentId}/lessons/${lessonId}/`),
  updateLessonProgress: (enrollmentId, lessonId, data) =>
    api.patch(`${BASE}/enrollments/${enrollmentId}/lessons/${lessonId}/progress/`, data),

  // Authenticated — Review
  submitReview: (slug, data) => api.post(`${BASE}/${slug}/review/`, data),
};
