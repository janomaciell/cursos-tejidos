import api from './axios';

export const coursesAPI = {
  getAllCourses: async (params = {}) => {
    const response = await api.get('/courses/', { params });
    return response.data;
  },

  getCourseBySlug: async (slug) => {
    const response = await api.get(`/courses/${slug}/`);
    return response.data;
  },

  getFeaturedCourses: async () => {
    const response = await api.get('/courses/featured/');
    return response.data;
  },

  checkCourseAccess: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/check_access/`);
    return response.data;
  },

  getCourseModules: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/modules/`);
    return response.data;
  },

  getLessonDetail: async (lessonId) => {
    const response = await api.get(`/courses/lessons/${lessonId}/`);
    return response.data;
  },

  getLessonProgress: async (courseId) => {
    const response = await api.get(`/courses/progress/by_course/`, {
      params: { course_id: courseId }
    });
    return response.data;
  },

  updateLessonProgress: async (progressData) => {
    const response = await api.post('/courses/progress/', progressData);
    return response.data;
  }
};