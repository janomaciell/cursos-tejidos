import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { paymentsAPI } from '../../api/payments';
import { coursesAPI } from '../../api/courses';
import VideoPlayer from '../../courses/VideoPlayer';
import Loader from '../../components/common/Loader';
import NgrokImage from '../../components/common/NgrokImage';
import { 
  FiPlay, 
  FiClock, 
  FiBook, 
  FiCheckCircle,
  FiFilter,
  FiGrid,
  FiList,
  FiTrendingUp,
  FiAward,
  FiTarget
} from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './MyCourses.css';

gsap.registerPlugin(ScrollTrigger);

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, in-progress, completed
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [sortBy, setSortBy] = useState('recent'); // recent, progress, title
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerCourse, setPlayerCourse] = useState(null);
  const [playerLesson, setPlayerLesson] = useState(null);
  
  const statsRef = useRef([]);
  const cardsRef = useRef([]);

  useEffect(() => {
    loadMyCourses();
  }, []);

  useEffect(() => {
    // Animaciones de entrada
    if (!loading && courses.length > 0) {
      const tl = gsap.timeline({ delay: 0.2 });

      tl.fromTo('.my-courses-hero',
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      )
      .fromTo('.stat-card',
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(1.2)' },
        '-=0.3'
      )
      .fromTo('.controls-bar',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      )
      .fromTo('.my-course-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      );
    }
  }, [loading, courses]);

  useEffect(() => {
    // Filtrar y ordenar cursos
    let filtered = [...courses];

    // Filtro
    if (filter === 'in-progress') {
      filtered = filtered.filter(c => c.progress > 0 && c.progress < 100);
    } else if (filter === 'completed') {
      filtered = filtered.filter(c => c.progress === 100);
    }

    // Ordenar
    if (sortBy === 'progress') {
      filtered.sort((a, b) => b.progress - a.progress);
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.course.title.localeCompare(b.course.title));
    } else {
      // recent - por fecha de compra
      filtered.sort((a, b) => new Date(b.purchased_at) - new Date(a.purchased_at));
    }

    setFilteredCourses(filtered);

    // Animar cambio
    if (courses.length > 0) {
      gsap.fromTo('.my-course-card',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [filter, sortBy, courses]);

  const loadMyCourses = async () => {
    try {
      const data = await paymentsAPI.getMyCourses();
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setCourses(list);
      setFilteredCourses(list);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    if (courses.length === 0) return null;

    const totalProgress = courses.reduce((sum, c) => sum + c.progress, 0);
    const avgProgress = Math.round(totalProgress / courses.length);
    const completed = courses.filter(c => c.progress === 100).length;
    const inProgress = courses.filter(c => c.progress > 0 && c.progress < 100).length;

    return {
      total: courses.length,
      avgProgress,
      completed,
      inProgress
    };
  };

  const findFirstIncompleteLesson = (modules, progressMap) => {
    for (const module of modules) {
      if (!module.lessons) continue;
      for (const lesson of module.lessons) {
        if (!progressMap[lesson.id]?.completed) return lesson;
      }
    }
    return null;
  };

  const openInlinePlayer = async (access) => {
    try {
      setPlayerOpen(true);
      setPlayerLoading(true);
      setPlayerCourse(access.course);
      setPlayerLesson(null);

      const [modulesData, progressData] = await Promise.all([
        coursesAPI.getCourseModules(access.course.id),
        coursesAPI.getLessonProgress(access.course.id)
      ]);

      const modulesList = Array.isArray(modulesData) ? modulesData : [];
      const progressList = Array.isArray(progressData) ? progressData : (progressData?.results ?? []);
      const progressMap = {};
      progressList.forEach((p) => { progressMap[p.lesson] = p; });

      const firstIncomplete = findFirstIncompleteLesson(modulesList, progressMap);
      setPlayerLesson(firstIncomplete || modulesList[0]?.lessons?.[0] || null);
    } catch (error) {
      console.error('Error al cargar lección para reproducir:', error);
      setPlayerLesson(null);
    } finally {
      setPlayerLoading(false);
    }
  };

  const closeInlinePlayer = () => {
    setPlayerOpen(false);
    setPlayerLesson(null);
    setPlayerCourse(null);
  };

  const handleInlineProgress = async (progressPercentage) => {
    if (!playerLesson) return;
    const isCompleted = progressPercentage >= 90;

    try {
      await coursesAPI.updateLessonProgress({
        lesson: playerLesson.id,
        progress_percentage: progressPercentage,
        completed: isCompleted
      });

      if (isCompleted) {
        loadMyCourses();
      }
    } catch (error) {
      console.error('Error al actualizar progreso desde Mis Cursos:', error);
    }
  };

  const stats = calculateStats();

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="my-courses-page">
      {/* Hero */}
      <section className="my-courses-hero">
        <div className="hero-pattern"></div>
        <div className="my-courses-hero-content">
          <div className="hero-icon">
            <FiBook />
          </div>
          <h1 className="my-courses-title">Mis Cursos</h1>
          <p className="my-courses-subtitle">
            Tu espacio personal de aprendizaje y crecimiento
          </p>
        </div>
      </section>

      <div className="my-courses-container">
        {courses.length > 0 ? (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card" ref={el => statsRef.current[0] = el}>
                <div className="stat-icon total">
                  <FiBook />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Cursos Activos</div>
                </div>
              </div>

              <div className="stat-card" ref={el => statsRef.current[1] = el}>
                <div className="stat-icon progress">
                  <FiTrendingUp />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.avgProgress}%</div>
                  <div className="stat-label">Progreso Promedio</div>
                </div>
              </div>

              <div className="stat-card" ref={el => statsRef.current[2] = el}>
                <div className="stat-icon in-progress">
                  <FiTarget />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.inProgress}</div>
                  <div className="stat-label">En Progreso</div>
                </div>
              </div>

              <div className="stat-card" ref={el => statsRef.current[3] = el}>
                <div className="stat-icon completed">
                  <FiAward />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.completed}</div>
                  <div className="stat-label">Completados</div>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="controls-bar">
              <div className="filters">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Todos
                </button>
                <button
                  className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setFilter('in-progress')}
                >
                  <FiTrendingUp />
                  En Progreso
                </button>
                <button
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  <FiCheckCircle />
                  Completados
                </button>
              </div>

              <div className="controls">
                <div className="sort-select">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recent">Más Recientes</option>
                    <option value="progress">Mayor Progreso</option>
                    <option value="title">Por Nombre</option>
                  </select>
                </div>

                <div className="view-toggle">
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Vista de cuadrícula"
                  >
                    <FiGrid />
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="Vista de lista"
                  >
                    <FiList />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="results-count">
              Mostrando <strong>{filteredCourses.length}</strong> de <strong>{courses.length}</strong> cursos
            </div>

            {/* Courses Grid/List */}
            <div className={`my-courses-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
              {filteredCourses.map((access, index) => (
                <div 
                  key={access.id} 
                  className="my-course-card" 
                  ref={el => cardsRef.current[index] = el}
                >
                  <Link to={`/curso/${access.course.id}/player`} className="course-image-wrapper">
                    <NgrokImage 
                      src={access.course.cover_image}
                      alt={access.course.title}
                    />
                    <div className="course-overlay">
                      <div className="play-button">
                        <FiPlay />
                      </div>
                    </div>
                    {access.progress === 100 && (
                      <div className="completed-badge">
                        <FiCheckCircle />
                        <span>Completado</span>
                      </div>
                    )}
                    {access.progress === 0 && (
                      <div className="new-badge">
                        Nuevo
                      </div>
                    )}
                  </Link>

                  <div className="course-info">
                    <Link to={`/curso/${access.course.id}/player`}>
                      <h3 className="course-title">{access.course.title}</h3>
                    </Link>
                    
                    <p className="course-short-desc">{access.course.short_description}</p>

                    <div className="course-meta">
                      <span className="meta-item">
                        <FiClock /> {access.course.duration_hours}h
                      </span>
                      <span className="meta-item">
                        <FiBook /> {access.course.total_lessons} lecciones
                      </span>
                    </div>

                    <div className="progress-section">
                      <div className="progress-header">
                        <span className="progress-label">Tu progreso</span>
                        <span className="progress-percentage">{access.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${access.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="course-footer">
                      <span className="purchase-date">
                        <FiClock />
                        {formatDate(access.purchased_at)}
                      </span>
                      <button
                        type="button"
                        className="continue-btn"
                        onClick={() => openInlinePlayer(access)}
                      >
                        {access.progress === 0 ? (
                          <>
                            <FiPlay />
                            Empezar Curso
                          </>
                        ) : access.progress === 100 ? (
                          <>
                            <FiCheckCircle />
                            Ver de Nuevo
                          </>
                        ) : (
                          <>
                            <FiPlay />
                            Continuar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-courses">
            <div className="empty-illustration">
              <div className="empty-icon">
                <FiBook />
              </div>
              <div className="empty-circle circle-1"></div>
              <div className="empty-circle circle-2"></div>
              <div className="empty-circle circle-3"></div>
            </div>
            <h2 className="empty-title">Aún no tienes cursos</h2>
            <p className="empty-text">
              Explora nuestro catálogo y comienza tu camino en la costura hoy mismo.<br />
              Más de 100 alumnas ya están aprendiendo.
            </p>
            <Link to="/cursos" className="browse-button">
              <FiBook />
              Explorar Cursos
            </Link>
          </div>
        )}
      </div>
      {playerOpen && (
        <div className="mycourses-player-overlay">
          <div
            className="mycourses-player-backdrop"
            onClick={closeInlinePlayer}
          ></div>
          <div className="mycourses-player-modal">
            <button
              type="button"
              className="mycourses-player-close"
              onClick={closeInlinePlayer}
              aria-label="Cerrar reproductor"
            >
              ×
            </button>
            {playerCourse && (
              <div className="mycourses-player-header">
                <h2>{playerCourse.title}</h2>
                {playerLesson && (
                  <p>{playerLesson.title}</p>
                )}
              </div>
            )}
            <div className="mycourses-player-body">
              {playerLoading || !playerLesson ? (
                <div className="mycourses-player-loading">
                  <Loader />
                  <p>Cargando lección...</p>
                </div>
              ) : (
                <VideoPlayer
                  lessonId={playerLesson.id}
                  onProgress={handleInlineProgress}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;