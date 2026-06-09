import apiClient from './client';

export const getTopics = () =>
  apiClient.get('/topic/').then((res) => res.data);

export const getTopicById = (id) =>
  apiClient.get(`/topic/${id}`).then((res) => res.data);

export const createTopic = (data) =>
  apiClient.post('/topic/', data).then((res) => res.data);

export const updateTopic = (data) =>
  apiClient.put('/topic/', data).then((res) => res.data);

export const deleteTopic = (id) =>
  apiClient.delete(`/topic/${id}`);
