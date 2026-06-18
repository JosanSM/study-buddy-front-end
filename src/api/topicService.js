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

// confidence is collected client-side; included for forward-compatibility when
// the backend adds spaced-repetition interval tuning based on confidence level.
export const reviewTopic = (id, confidence) =>
  apiClient.post(`/topic/${id}/review`, { confidence }).then((res) => res.data);
