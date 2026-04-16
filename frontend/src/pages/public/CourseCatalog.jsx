import { useState, useEffect, useRef } from 'react';
import { coursesAPI } from '../../api/courses';
import CourseList from '../../courses/CourseList';
import CourseFilter from '../../courses/CourseFilter';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './CourseCatalog.css';

gsap.registerPlugin(ScrollTrigger);

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState('grid');
  const heroRef = useRef(null);

  useEffect(() => {
    loadCourses();
  }, [filters, searchTerm]);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });
    
    tl.fromTo('.action-bar-content',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );

    tl.fromTo(['.action-bar-title', '.action-bar-tools'],
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    );

    tl.fromTo('.results-count-badge',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' },
      '-=0.3'
    );

    tl.fromTo('.catalog-sidebar',
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.2'
    )
    .fromTo('.catalog-content',
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.5'
    );

    return () => {
      tl.kill();
    };
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== false && v != null)
      );

      const params = {
        ...cleanFilters,
        ...(searchTerm ? { search: searchTerm } : {})
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
    
    gsap.fromTo('.catalog-content',
      { opacity: 0.5, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    
    if (!showFilters) {
      gsap.fromTo('.catalog-sidebar',
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    gsap.fromTo('.search-input',
      { scale: 1.05 },
      { scale: 1, duration: 0.3, ease: 'back.out(1.5)' }
    );
  };


  return (
    <div className="catalog-page">
      {/* Header */}
      <section className="catalog-action-bar" ref={heroRef}>
        <div className="action-bar-content">
          <h1 className="action-bar-title">Explorar Cursos</h1>
          
          <div className="action-bar-tools">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="¿Qué buscás?"
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={clearSearch}>
                  <FiX />
                </button>
              )}
            </div>

            <button 
              className="filter-toggle-btn"
              onClick={toggleFilters}
              aria-label="Filtros"
            >
              <FiFilter />
              <span>Filtros</span>
            </button>

            <div className="view-toggle">
              <button
                className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
                onClick={() => setActiveView('grid')}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="2" y="2" width="7" height="7" rx="1"/>
                  <rect x="11" y="2" width="7" height="7" rx="1"/>
                  <rect x="2" y="11" width="7" height="7" rx="1"/>
                  <rect x="11" y="11" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="2" y="3" width="16" height="3" rx="1"/>
                  <rect x="2" y="8.5" width="16" height="3" rx="1"/>
                  <rect x="2" y="14" width="16" height="3" rx="1"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="results-count-badge">
            {courses.length} cursos
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="catalog-container">
        <aside className={`catalog-sidebar ${showFilters ? 'show' : ''}`}>
          <div className="sidebar-header">
            <h3>
              <FiFilter />
              Filtrar cursos
            </h3>
            <button 
              className="close-filters-btn"
              onClick={toggleFilters}
              aria-label="Cerrar filtros"
            >
              <FiX />
            </button>
          </div>
          
          <div className="sidebar-content">
            <CourseFilter onFilterChange={handleFilterChange} />
          </div>

          {Object.keys(filters).length > 0 && (
            <div className="sidebar-footer">
              <button 
                className="reset-filters-btn"
                onClick={() => {
                  setFilters({});
                  gsap.fromTo('.reset-filters-btn',
                    { scale: 0.95 },
                    { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' }
                  );
                }}
              >
                <FiX />
                Limpiar filtros
              </button>
            </div>
          )}
        </aside>

        <main className="catalog-content">
          <CourseList 
            courses={courses} 
            loading={loading}
            viewMode={activeView}
          />
          
          {!loading && courses.length === 0 && (
            <div className="no-results">
              <div className="no-results-illustration">
                <FiSearch className="no-results-icon" />
                <div className="illustration-circle circle-1"></div>
                <div className="illustration-circle circle-2"></div>
                <div className="illustration-circle circle-3"></div>
              </div>
              <h3>No encontramos cursos</h3>
              <p>
                {searchTerm 
                  ? `No hay resultados para "${searchTerm}"`
                  : 'Intentá ajustar los filtros o realizar otra búsqueda'
                }
              </p>
              <button 
                className="reset-search-btn"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({});
                }}
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </main>
      </div>

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