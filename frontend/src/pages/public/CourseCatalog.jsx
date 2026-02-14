import { useState, useEffect } from 'react';
import { coursesAPI } from '../../api/courses';
import CourseList from '../../courses/CourseList';
import CourseFilter from '../../courses/CourseFilter';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import './CourseCatalog.css';

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="catalog-page">
      {/* Header */}
      <section className="catalog-hero">
        <div className="catalog-hero-content">
          <h1 className="catalog-title">Catálogo de Cursos</h1>
          <p className="catalog-subtitle">
            Descubrí todos nuestros cursos y encontrá el camino perfecto para vos
          </p>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscá tu curso ideal..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          
          <button 
            className="filter-toggle-btn"
            onClick={toggleFilters}
          >
            <FiFilter />
            Filtros
          </button>
        </div>

        <div className="results-info">
          <p>
            {loading ? 'Cargando...' : (
              <>
                <span className="results-count">{courses.length}</span> 
                {' '}curso{courses.length !== 1 ? 's' : ''} disponible{courses.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="catalog-container">
        <aside className={`catalog-sidebar ${showFilters ? 'show' : ''}`}>
          <div className="sidebar-header">
            <h3>Filtrar cursos</h3>
            <button 
              className="close-filters-btn"
              onClick={toggleFilters}
            >
              <FiX />
            </button>
          </div>
          <CourseFilter onFilterChange={handleFilterChange} />
        </aside>

        <main className="catalog-content">
          <CourseList courses={courses} loading={loading} />
          
          {!loading && courses.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon"><FiSearch /></div>
              <h3>No encontramos cursos</h3>
              <p>Intentá con otros términos de búsqueda o ajustá los filtros</p>
            </div>
          )}
        </main>
      </div>

      {/* Overlay para mobile */}
      {showFilters && (
        <div 
          className="sidebar-overlay"
          onClick={toggleFilters}
        ></div>
      )}
    </div>
  );
};

export default CourseCatalog;