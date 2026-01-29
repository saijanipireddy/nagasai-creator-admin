import axios from 'axios';

export const BACKEND_URL = 'https://nagasai-creator-backend-2.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br'
  },
  timeout: 30000
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper to extract data from paginated responses
const extractData = (response) => {
  const data = response.data;
  // Handle paginated response format
  if (data && data.courses) return { ...response, data: data.courses, pagination: data.pagination };
  if (data && data.topics) return { ...response, data: data.topics, pagination: data.pagination };
  return response;
};

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile')
};

// Course APIs
export const courseAPI = {
  getAll: (options = {}) => {
    const { page = 1, limit = 100 } = options;
    return api.get(`/courses?page=${page}&limit=${limit}`).then(extractData);
  },
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getTopics: (id, options = {}) => {
    const { page = 1, limit = 200 } = options;
    return api.get(`/courses/${id}/topics?page=${page}&limit=${limit}`).then(extractData);
  },
  getStats: () => api.get('/courses/stats'),
  reorder: (courses) => api.put('/courses/reorder', { courses })
};

// Topic APIs
export const topicAPI = {
  getAll: (options = {}) => {
    const { page = 1, limit = 100 } = options;
    return api.get(`/topics?page=${page}&limit=${limit}`).then(extractData);
  },
  getById: (id) => api.get(`/topics/${id}`),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.put(`/topics/${id}`, data),
  delete: (id) => api.delete(`/topics/${id}`),
  reorder: (topics) => api.put('/topics/reorder', { topics })
};

// Upload API
export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;
