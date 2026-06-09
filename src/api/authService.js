import apiClient from './client';

export const login = (credentials) =>
  apiClient.post('/auth/login', credentials).then((res) => res.data);

export const register = (userData) =>
  apiClient.post('/auth/register', userData).then((res) => res.data);