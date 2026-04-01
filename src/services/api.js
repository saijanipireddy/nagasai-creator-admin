import axios from 'axios';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

// Resolve file URLs from Supabase Storage
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  return filePath;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with every request
  timeout: 30000,
});

/* ------------------------------------------------------------------ */
/*  CSRF: read csrf_token cookie and send as X-CSRF-Token header      */
/* ------------------------------------------------------------------ */
const getCsrfToken = () => {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='));
  return match ? match.split('=')[1] : null;
};

api.interceptors.request.use((config) => {
  // Attach CSRF token to state-changing requests
  if (!['get', 'head', 'options'].includes(config.method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

/* ------------------------------------------------------------------ */
/*  AUTO-REFRESH: on 401, try to refresh the access token once        */
/* ------------------------------------------------------------------ */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, attempt a token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed — redirect to login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper to extract data from paginated responses
const extractData = (response) => {
  const data = response.data;
  if (data && data.courses) return { ...response, data: data.courses, pagination: data.pagination };
  if (data && data.topics) return { ...response, data: data.topics, pagination: data.pagination };
  return response;
};

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
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

// Job APIs
export const jobAPI = {
  getAll: () => api.get('/jobs/all').then(res => ({ ...res, data: res.data.jobs })),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

// Batch APIs
export const batchAPI = {
  getAll: () => api.get('/batches').then(res => ({ ...res, data: res.data.batches })),
  getById: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post('/batches', data),
  update: (id, data) => api.put(`/batches/${id}`, data),
  delete: (id) => api.delete(`/batches/${id}`),
  // Courses
  assignCourses: (id, courseIds) => api.post(`/batches/${id}/courses`, { courseIds }),
  removeCourse: (id, courseId) => api.delete(`/batches/${id}/courses/${courseId}`),
  // Students
  getAllStudents: () => api.get('/batches/students/all').then(res => ({ ...res, data: res.data.students })),
  onboardStudent: (data) => api.post('/batches/students/onboard', data),
  enrollStudents: (id, studentIds, paymentStatus = 'paid') => api.post(`/batches/${id}/students`, { studentIds, paymentStatus }),
  updateEnrollment: (id, studentId, data) => api.put(`/batches/${id}/students/${studentId}`, data),
  removeStudent: (id, studentId) => api.delete(`/batches/${id}/students/${studentId}`),
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
