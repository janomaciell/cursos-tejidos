import { useState, useEffect } from 'react';
import { coursesAPI } from '../api/courses';

export const useCourses = (filters = {}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [JSON.stringify(filters)]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesAPI.getAllCourses(filters);
      setCourses(data.results || data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { courses, loading, error, refetch: fetchCourses };
};