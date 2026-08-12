import api from './api.js';

export const whiteboardService = {
  getSessions: () => api.get('/sessions').then((r) => r.data),
  createSession: (data) => api.post('/sessions', data).then((r) => r.data),
  getSession: (id) => api.get(`/sessions/${id}`).then((r) => r.data),
  saveSession: (id, payload) => api.post(`/sessions/${id}/save`, payload).then((r) => r.data),
  joinSession: (id) => api.post(`/sessions/${id}/join`).then((r) => r.data),
  deleteSession: (id) => api.delete(`/sessions/${id}`).then((r) => r.data),
};
