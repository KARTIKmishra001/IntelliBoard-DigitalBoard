import api from './api.js';

export const attendanceService = {
  getSessionAttendance: (sessionId) => api.get(`/attendance/session/${sessionId}`).then((r) => r.data),
  getStudentAttendance: (studentId) => api.get(`/attendance/student/${studentId}`).then((r) => r.data),
  markAttendance: (data) => api.post('/attendance/mark', data).then((r) => r.data),
  markManual: (data) => api.post('/attendance/manual', data).then((r) => r.data),
  getCourseStats: (courseId) => api.get(`/attendance/course/${courseId}/stats`).then((r) => r.data),
};
