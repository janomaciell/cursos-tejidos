import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../api/auth';
import { paymentsAPI } from '../../api/payments';
import { 
  FiBook, 
  FiDollarSign, 
  FiAward,
  FiPlay,
  FiClock,
  FiTrendingUp,
  FiTarget
} from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import NgrokImage from '../../components/common/NgrokImage';
import gsap from 'gsap';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && stats) {
      // Animaciones de entrada
      const tl = gsap.timeline({ delay: 0.2 });
      
      tl.fromTo('.dashboard-header',
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      )
      .fromTo('.stat-card',
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(1.2)' },
        '-=0.3'
      )
      .fromTo('.recent-courses-section',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      )
      .fromTo('.course-item',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );
    }
  }, [loading, stats]);

  const loadDashboardData = async () => {
    try {
      const [statsData, coursesData] = await Promise.all([
        authAPI.getUserStats(),
        paymentsAPI.getMyCourses()
      ]);

      setStats(statsData);
      const courses = coursesData.results?.slice(0, 3) || coursesData.slice(0, 3);
      setRecentCourses(courses);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="greeting">
            <h1>¡Hola, {user?.first_name}! 👋</h1>
            <p>Aquí está tu resumen de aprendizaje</p>
          </div>
          <Link to="/cursos" className="explore-btn">
            <FiTarget />
            Explorar Cursos
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" ref={el => statsRef.current[0] = el}>
          <div className="stat-icon courses">
            <FiBook />
          </div>
          <div className="stat-info">
            <h3>{stats?.courses_purchased || 0}</h3>
            <p>Cursos Activos</p>
            <div className="stat-trend">
              <FiTrendingUp />
              <span>En progreso</span>
            </div>
          </div>
        </div>

        <div className="stat-card" ref={el => statsRef.current[1] = el}>
          <div className="stat-icon lessons">
            <FiAward />
          </div>
          <div className="stat-info">
            <h3>{stats?.lessons_completed || 0}</h3>
            <p>Lecciones Completadas</p>
            <div className="stat-trend">
              <FiTrendingUp />
              <span>Sigue así</span>
            </div>
          </div>
        </div>

        <div className="stat-card" ref={el => statsRef.current[2] = el}>
          <div className="stat-icon investment">
            <FiDollarSign />
          </div>
          <div className="stat-info">
            <h3>${stats?.total_spent?.toFixed(2) || '0.00'}</h3>
            <p>Total Invertido</p>
            <div className="stat-trend">
              <FiTrendingUp />
              <span>En tu futuro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="recent-courses-section">
        <div className="section-header">
          <div className="section-title">
            <FiClock />
            <h2>Continúa Aprendiendo</h2>
          </div>
          <Link to="/mis-cursos" className="view-all-link">
            Ver Todos
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {recentCourses.length > 0 ? (
          <div className="courses-grid">
            {recentCourses.map((access) => (
              <div key={access.id} className="course-item">
                <Link to={`/curso/${access.course.id}/player`} className="course-image-link">
                  <NgrokImage 
                    src={access.course.cover_image}
                    alt={access.course.title}
                  />
                  <div className="course-overlay">
                    <div className="play-icon">
                      <FiPlay />
                    </div>
                  </div>
                  {access.progress === 100 && (
                    <div className="completed-badge">
                      <FiAward />
                      Completado
                    </div>
                  )}
                </Link>
                
                <div className="course-item-content">
                  <Link to={`/curso/${access.course.id}/player`}>
                    <h3>{access.course.title}</h3>
                  </Link>
                  
                  <div className="progress-section">
                    <div className="progress-header">
                      <span className="progress-label">Progreso</span>
                      <span className="progress-percentage">{access.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${access.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Link to={`/curso/${access.course.id}/player`} className="continue-btn">
                    <FiPlay />
                    {access.progress === 0 ? 'Comenzar' : 'Continuar'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FiBook />
            </div>
            <h3>Aún no tienes cursos</h3>
            <p>Explora nuestro catálogo y comienza tu viaje de aprendizaje hoy</p>
            <Link to="/cursos" className="browse-btn">
              <FiTarget />
              Explorar Cursos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;