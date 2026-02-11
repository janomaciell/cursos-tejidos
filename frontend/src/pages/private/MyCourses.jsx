import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentsAPI } from '../../api/payments';
import Loader from '../../components/common/Loader';
import { FiPlay, FiClock, FiBook } from 'react-icons/fi';
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
      <div className="page-header">
        <h1>Mis Cursos</h1>
        <p>Accede a todos tus cursos adquiridos</p>
      </div>

      {list.length > 0 ? (
        <div className="my-courses-grid">
          {list.map((access) => (
            <div key={access.id} className="my-course-card">
              <div className="course-image-wrapper">
                <img src={access.course.cover_image} alt={access.course.title} />
                <div className="course-overlay">
                  <Link to={`/curso/${access.course.id}/player`} className="play-button">
                    <FiPlay />
                  </Link>
                </div>
              </div>

              <div className="course-info">
                <h3>{access.course.title}</h3>
                <p className="course-short-desc">{access.course.short_description}</p>

                <div className="course-meta">
                  <span>
                    <FiClock /> {access.course.duration_hours}h
                  </span>
                  <span>
                    <FiBook /> {access.course.total_lessons} lecciones
                  </span>
                </div>

                <div className="progress-section">
                  <div className="progress-header">
                    <span>Progreso</span>
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
                    Comprado el {formatDate(access.purchased_at)}
                  </span>
                  <Link to={`/curso/${access.course.id}/player`} className="continue-link">
                    {access.progress > 0 ? 'Continuar' : 'Empezar'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-courses">
          <div className="empty-icon">
            <FiBook />
          </div>
          <h2>No tienes cursos aún</h2>
          <p>Explora nuestro catálogo y comienza tu aprendizaje hoy</p>
          <Link to="/cursos" className="browse-button">
            Explorar Cursos
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyCourses;