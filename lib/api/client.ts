import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            searchParams.append(key, value.toString());
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      return searchParams.toString();
    },
  },
});

apiClient.interceptors.request.use((config) => {
  return config;
});