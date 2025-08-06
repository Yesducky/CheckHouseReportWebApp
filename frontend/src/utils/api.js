import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL+ '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const eventAPI = {
  createEvent: () => api.get('/events'),
  getEvent: (url) => api.get(`/events/url/${url}`),
  updateEvent: (url, data) => api.put(`/events/url/${url}`, data),
  addProblem: (url, problemData) => api.post(`/events/url/${url}/problems`, problemData),
  generateReport: (url) => api.get(`/events/${url}/report`, {
    responseType: 'blob' // Important for file download
  }),

  // House management
  getHouses: () => api.get('/houses'),

  // Chat API - updated to match Socket.IO backend
  getChatMessages: (url) => api.get(`/events/url/${url}/chat/messages`),
  sendChatMessage: (url, messageData) => api.post(`/events/url/${url}/chat/messages`, messageData),

  // Health check endpoint
  healthCheck: () => api.get('/health'),
};

// Socket.IO configuration helper
export const socketConfig = {
  url: API_BASE_URL,
  options: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  }
};

export default api;