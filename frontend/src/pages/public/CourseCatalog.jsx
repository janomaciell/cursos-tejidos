import { useState, useEffect } from 'react';
import { coursesAPI } from '../../api/courses';
import CourseList from '../../courses/CourseList';
import CourseFilter from '../../courses/CourseFilter';
import { FiSearch } from 'react-icons/fi';
import './CourseCatalog.css';

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCourses();
  }, [filters, searchTerm]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        search: searchTerm
      };
      const data = await coursesAPI.getAllCourses(params);
      setCourses(data.results || data);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Catálogo de Cursos</h1>
        <p>Explora todos nuestros cursos de costura y tejido</p>
      </div>

      <div className="catalog-container">
        <aside className="catalog-sidebar">
          <CourseFilter onFilterChange={handleFilterChange} />
        </aside>

        <main className="catalog-content">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="results-info">
            <p>{courses.length} curso{courses.length !== 1 ? 's' : ''} encontrado{courses.length !== 1 ? 's' : ''}</p>
          </div>

          <CourseList courses={courses} loading={loading} />
        </main>
      </div>
    </div>
  );
};

export default CourseCatalog;