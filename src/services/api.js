import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile')
};

// Course APIs
export const courseAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getTopics: (id) => api.get(`/courses/${id}/topics`),
  getStats: () => api.get('/courses/stats'),
  reorder: (courses) => api.put('/courses/reorder', { courses })
};

// Topic APIs
export const topicAPI = {
  getAll: () => api.get('/topics'),
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
