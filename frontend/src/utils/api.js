import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const eventAPI = {
  createEvent: () => api.get('/events'),
  // getEvent: (eventId) => api.get(`/events/${eventId}`),
  getEvent: (url) => api.get(`/events/url/${url}`),
  // updateEvent: (eventId, data) => api.put(`/events/${eventId}`, data),
  updateEvent: (url, data) => api.put(`/events/url/${url}`, data),
  // addProblem: (eventId, problemData) => api.post(`/events/${eventId}/problems`, problemData),
  addProblem: (url, problemData) => api.post(`/events/url/${url}/problems`, problemData),
  generateReport: (url) => api.get(`/events/${url}/report`, {
    responseType: 'blob' // Important for file download
  }),

  getHouses: () => api.get('/houses'),
};

export default api;