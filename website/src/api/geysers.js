import api from './axios';

export const geysersApi = {
  getPackages: (params) => api.get('/geysers/packages/', { params }),
  getPackage: (slug) => api.get(`/geysers/packages/${slug}/`),
};

export default geysersApi;
