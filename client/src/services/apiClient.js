import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Adapt host when accessing the frontend from a local network IP (e.g. 192.168.x.x)
if (
  typeof window !== 'undefined' &&
  window.location.hostname &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1' &&
  baseURL.includes('localhost')
) {
  baseURL = baseURL.replace('localhost', window.location.hostname);
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Response interceptor to normalize error message structures
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returned a structured JSON error response
    if (error.response?.data?.error) {
      return Promise.reject(error.response.data.error);
    }
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: error.message || 'Unable to connect to the Syncora server.'
    });
  }
);

export default apiClient;
