import axios from 'axios';

// удалить урок
export const deleteLesson = (id: string) => api.delete(`/subjects/lessons/${id}`);

// удалить модуль
export const deleteModule = (id: string) => api.delete(`/subjects/modules/${id}`);

// удалить предмет
export const deleteSubject = (id: string) => api.delete(`/subjects/${id}`);

export const updateSubject = (id: string | number, data: { title: string }) =>
  api.patch(`/subjects/${id}`, data);

export const createSubject = (data: { title: string }) =>
  api.post("/subjects", data);


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

// ↓↓↓ ДОБАВЬ ЭТО
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    (api.defaults.headers.common.Authorization
      ? String(api.defaults.headers.common.Authorization).replace(/^Bearer\s+/i, '')
      : '');

  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// ↑↑↑ ДОБАВЬ ЭТО

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      original.url !== '/auth/refresh'
    ) {
      original._retry = true;
      try {
        const res = await api.post<{ access_token: string }>('/auth/refresh');
        const newToken = res.data.access_token;
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
