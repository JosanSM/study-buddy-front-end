import apiClient from './client';

export const getSubjects = () =>
  apiClient.get('/subject/').then((res) => res.data);

export const getSubjectById = (id) =>
  apiClient.get(`/subject/${id}`).then((res) => res.data);

export const createSubject = (data) =>
  apiClient.post('/subject/', data).then((res) => res.data);

export const updateSubject = (data) =>
  apiClient.put('/subject/', data).then((res) => res.data);

export const deleteSubject = (id) =>
  apiClient.delete(`/subject/${id}`);