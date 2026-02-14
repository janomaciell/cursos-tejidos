import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentsAPI } from '../../api/payments';
import Loader from '../../components/common/Loader';
import { FiPlay, FiClock, FiBook, FiCheckCircle } from 'react-icons/fi';
import './MyCourses.css';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      const data = await paymentsAPI.getMyCourses();
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setCourses(list);
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

  if (loading) {
    return <Loader fullScreen />;
  }

  const list = Array.isArray(courses) ? courses : [];

  return (
    <div className="my-courses-page">
      {/* Header */}
      <section className="my-courses-hero">
        <div className="my-courses-hero-content">
          <h1 className="my-courses-title">Mis Cursos</h1>
          <p className="my-courses-subtitle">
            Tu espacio de aprendizaje personal
          </p>
        </div>
      </section>

      <div className="my-courses-container">
        {list.length > 0 ? (
          <>
            <div className="courses-stats">
              <div className="stat-item">
                <span className="stat-number">{list.length}</span>
                <span className="stat-label">curso{list.length !== 1 ? 's' : ''} activo{list.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {Math.round(list.reduce((sum, c) => sum + c.progress, 0) / list.length)}%
                </span>
                <span className="stat-label">progreso promedio</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {list.filter(c => c.progress === 100).length}
                </span>
                <span className="stat-label">completado{list.filter(c => c.progress === 100).length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="my-courses-grid">
              {list.map((access, index) => (
                <div key={access.id} className="my-course-card" data-index={index}>
                  <Link to={`/curso/${access.course.id}/player`} className="course-image-wrapper">
                    <img src={access.course.cover_image} alt={access.course.title} />
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
                        Comenzaste el {formatDate(access.purchased_at)}
                      </span>
                      <Link to={`/curso/${access.course.id}/player`} className="continue-link">
                        {access.progress > 0 ? 'Continuar' : 'Empezar'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-courses">
            <div className="empty-icon">
              <FiBook />
            </div>
            <h2 className="empty-title">Aún no tenés cursos</h2>
            <p className="empty-text">
              Explorá nuestro catálogo y comenzá tu camino en la costura hoy mismo
            </p>
            <Link to="/cursos" className="browse-button">
              Explorar Cursos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;