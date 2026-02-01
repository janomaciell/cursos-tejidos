import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../api/auth';
import { paymentsAPI } from '../../api/payments';
import { FiBook, FiDollarSign, FiAward } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, coursesData] = await Promise.all([
        authAPI.getUserStats(),
        paymentsAPI.getMyCourses()
      ]);

      setStats(statsData);
      setRecentCourses(coursesData.results?.slice(0, 3) || coursesData.slice(0, 3));
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
      <div className="dashboard-header">
        <h1>Bienvenido, {user?.first_name}!</h1>
        <p>Aquí está tu resumen de aprendizaje</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <FiBook style={{ color: '#2563eb' }} />
          </div>
          <div className="stat-info">
            <h3>{stats?.courses_purchased || 0}</h3>
            <p>Cursos Comprados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <FiAward style={{ color: '#16a34a' }} />
          </div>
          <div className="stat-info">
            <h3>{stats?.lessons_completed || 0}</h3>
            <p>Lecciones Completadas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <FiDollarSign style={{ color: '#d97706' }} />
          </div>
          <div className="stat-info">
            <h3>${stats?.total_spent?.toFixed(2) || '0.00'}</h3>
            <p>Total Invertido</p>
          </div>
        </div>
      </div>

      <div className="recent-courses-section">
        <div className="section-header">
          <h2>Cursos Recientes</h2>
          <Link to="/mis-cursos">Ver Todos</Link>
        </div>

        {recentCourses.length > 0 ? (
          <div className="courses-grid">
            {recentCourses.map((access) => (
              <div key={access.id} className="course-item">
                <img src={access.course.cover_image} alt={access.course.title} />
                <div className="course-item-content">
                  <h3>{access.course.title}</h3>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${access.progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{access.progress}% completado</p>
                  <Link to={`/curso/${access.course.id}/player`} className="continue-btn">
                    Continuar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Aún no tienes cursos. ¡Explora nuestro catálogo!</p>
            <Link to="/cursos" className="browse-btn">
              Ver Cursos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;