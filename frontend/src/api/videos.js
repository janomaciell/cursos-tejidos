import api from './axios';

export const videosAPI = {
  getVideoToken: async (lessonId) => {
    const response = await api.get(`/videos/token/${lessonId}/`);
    return response.data;
  },

  getVideoInfo: async (lessonId) => {
    const response = await api.get(`/videos/info/${lessonId}/`);
    return response.data;
  }
};