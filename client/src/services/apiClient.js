import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
