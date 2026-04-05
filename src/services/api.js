import axios from 'axios';

if (!import.meta.env.VITE_BACKEND_URL && import.meta.env.PROD) {
  throw new Error('VITE_BACKEND_URL environment variable is required in production');
}
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

// Resolve file URLs from Supabase Storage
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  return filePath;
};

/* ------------------------------------------------------------------ */
/*  TOKEN STORE                                                       */
/*  Access token: in-memory (short-lived, 15min)                      */
/*  Refresh token: localStorage (survives page refresh, 7-day TTL)    */
/* ------------------------------------------------------------------ */
let accessToken = null;

export const setTokens = (access, refresh) => {
  accessToken = access || null;
  if (refresh) {
    localStorage.setItem('admin_refresh_token', refresh);
  }
};

export const clearTokens = () => {
  accessToken = null;
  localStorage.removeItem('admin_refresh_token');
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => localStorage.getItem('admin_refresh_token');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Still send cookies when browser allows it
  timeout: 30000,
});

/* ------------------------------------------------------------------ */
/*  REQUEST INTERCEPTOR: attach Authorization header + CSRF           */
/* ------------------------------------------------------------------ */
api.interceptors.request.use((config) => {
  // Always send access token as Authorization header (works cross-origin)
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // For state-changing requests, also send CSRF token (when cookies work)
  if (!['get', 'head', 'options'].includes(config.method)) {
    const csrfMatch = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf_token='));
    if (csrfMatch) {
      config.headers['X-CSRF-Token'] = csrfMatch.split('=')[1];
    }
  }

  return config;
});

/* ------------------------------------------------------------------ */
/*  RESPONSE INTERCEPTOR: auto-refresh on 401                         */
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

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try refresh — send refresh token via header (cookies may be blocked cross-origin)
        const refreshConfig = {};
        const storedRefresh = getRefreshToken();
        if (storedRefresh) {
          refreshConfig.headers = { Authorization: `Bearer ${storedRefresh}` };
        }
        const { data } = await api.post('/auth/refresh', {}, refreshConfig);

        // Store new tokens from response body
        if (data.accessToken) {
          setTokens(data.accessToken, data.refreshToken);
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        clearTokens();
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
  refresh: (refreshToken) => {
    const config = {};
    const token = refreshToken || getRefreshToken();
    if (token) config.headers = { Authorization: `Bearer ${token}` };
    return api.post('/auth/refresh', {}, config);
  },
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
  assignCourses: (id, courseIds) => api.post(`/batches/${id}/courses`, { courseIds }),
  removeCourse: (id, courseId) => api.delete(`/batches/${id}/courses/${courseId}`),
  getAllStudents: () => api.get('/batches/students/all').then(res => ({ ...res, data: res.data.students })),
  onboardStudent: (data) => api.post('/batches/students/onboard', data),
  enrollStudents: (id, studentIds, paymentStatus = 'paid') => api.post(`/batches/${id}/students`, { studentIds, paymentStatus }),
  updateEnrollment: (id, studentId, data) => api.put(`/batches/${id}/students/${studentId}`, data),
  removeStudent: (id, studentId) => api.delete(`/batches/${id}/students/${studentId}`),
  getProgress: (id) => api.get(`/batches/${id}/progress`),
  getStudentProgress: (batchId, studentId) => api.get(`/batches/${batchId}/students/${studentId}/progress`),
  // Topic schedule
  getSchedule: (id, courseId) => api.get(`/batches/${id}/schedule/${courseId}`),
  autoSchedule: (id, data) => api.post(`/batches/${id}/schedule/auto`, data),
  bulkSchedule: (id, data) => api.post(`/batches/${id}/schedule/bulk`, data),
  toggleTopicUnlock: (id, topicId, unlock) => api.put(`/batches/${id}/schedule/toggle`, { topicId, unlock }),
  clearSchedule: (id, courseId) => api.delete(`/batches/${id}/schedule/${courseId}`),
};

// Announcement APIs
export const announcementAPI = {
  getAll: () => api.get('/announcements').then(res => ({ ...res, data: res.data.announcements })),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// Interview APIs
export const interviewAPI = {
  grantAccess: (data) => api.post('/interviews/access', data),
  revokeAccess: (id) => api.delete(`/interviews/access/${id}`),
  getAllAccess: () => api.get('/interviews/access').then(res => ({ ...res, data: res.data.accessList })),
  getAllInterviews: () => api.get('/interviews/all').then(res => ({ ...res, data: res.data.interviews })),
  getReport: (id) => api.get(`/interviews/report/${id}`),
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
