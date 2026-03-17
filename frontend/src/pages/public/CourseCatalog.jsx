import { useState, useEffect, useRef } from 'react';
import { coursesAPI } from '../../api/courses';
import CourseList from '../../courses/CourseList';
import CourseFilter from '../../courses/CourseFilter';
import { FiSearch, FiFilter, FiX, FiBookOpen, FiTrendingUp, FiAward } from 'react-icons/fi';
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
  const searchRef = useRef(null);

  useEffect(() => {
    loadCourses();
  }, [filters, searchTerm]);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });
    
    tl.fromTo('.catalog-hero-content',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );

    tl.fromTo('.stat-card',
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.6, ease: 'back.out(1.2)' },
      '-=0.5'
    );

    tl.fromTo('.search-section',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    );

    tl.fromTo('.catalog-sidebar',
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.3'
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

  const stats = [
    { icon: <FiBookOpen />, value: courses.length || '10+', label: 'Cursos disponibles' },
    { icon: <FiTrendingUp />, value: '500+', label: 'Alumnas activas' },
    { icon: <FiAward />, value: '100%', label: 'Técnica Profesional' }
  ];

  return (
    <div className="catalog-page">
      {/* Header */}
      <section className="catalog-hero" ref={heroRef}>
        <div className="hero-pattern"></div>
        <div className="catalog-hero-content">
          <div className="breadcrumb">
            <span>Inicio</span>
            <span className="separator">/</span>
            <span className="current">Catálogo</span>
          </div>
          
          <h1 className="catalog-title">
            Explorá Nuestros<br />
            <span className="title-accent">Cursos de Tejido</span>  
          </h1>
          
          <p className="catalog-subtitle">
            Desde cero hasta nivel profesional. Encontrá el curso perfecto para tu nivel y objetivos.
          </p>

          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="search-section" ref={searchRef}>
        <div className="search-wrapper">
          <div className="search-container">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por nombre, tema o nivel..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={clearSearch}
                  aria-label="Limpiar búsqueda"
                >
                  <FiX />
                </button>
              )}
            </div>
            
            <button 
              className="filter-toggle-btn"
              onClick={toggleFilters}
              aria-label="Mostrar filtros"
            >
              <FiFilter />
              <span>Filtros</span>
            </button>
          </div>

          <div className="search-meta">
            <div className="results-info">
              {loading ? (
                <div className="loading-pulse">
                  <span className="pulse-dot"></span>
                  <span>Buscando cursos...</span>
                </div>
              ) : (
                <p>
                  Mostrando <span className="results-count">{courses.length}</span> 
                  {' '}curso{courses.length !== 1 ? 's' : ''}
                  {searchTerm && (
                    <span className="search-query"> con "{searchTerm}"</span>
                  )}
                </p>
              )}
            </div>

            <div className="view-toggle">
              <button
                className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
                onClick={() => setActiveView('grid')}
                aria-label="Vista de cuadrícula"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="2" y="2" width="7" height="7" rx="1"/>
                  <rect x="11" y="2" width="7" height="7" rx="1"/>
                  <rect x="2" y="11" width="7" height="7" rx="1"/>
                  <rect x="11" y="11" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
                aria-label="Vista de lista"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="2" y="3" width="16" height="3" rx="1"/>
                  <rect x="2" y="8.5" width="16" height="3" rx="1"/>
                  <rect x="2" y="14" width="16" height="3" rx="1"/>
                </svg>
              </button>
            </div>
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