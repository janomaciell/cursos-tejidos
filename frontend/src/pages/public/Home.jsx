import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coursesAPI } from '../../api/courses';
import CourseList from '../../courses/CourseList';
import Button from '../../components/common/Button';
import { FiArrowRight, FiBook, FiUsers, FiAward } from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCourses();
  }, []);

  const loadFeaturedCourses = async () => {
    try {
      const data = await coursesAPI.getFeaturedCourses();
      setFeaturedCourses(data);
    } catch (error) {
      console.error('Error al cargar cursos destacados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Aprende Costura y Tejido Online</h1>
          <p>
            Descubre el arte de la costura con nuestros cursos especializados. 
            Desde peluches hasta sweaters, aprende técnicas profesionales desde casa.
          </p>
          <div className="hero-buttons">
            <Link to="/cursos">
              <Button size="large">
                Ver Cursos <FiArrowRight />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="large" variant="outline">
                Empezar Gratis
              </Button>
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/assets/images/hero-image.jpg" alt="Costura y Tejido" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon">
              <FiBook />
            </div>
            <h3>Cursos Especializados</h3>
            <p>Aprende técnicas específicas con cursos diseñados por expertos</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiUsers />
            </div>
            <h3>Comunidad Activa</h3>
            <p>Únete a miles de estudiantes apasionados por la costura</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiAward />
            </div>
            <h3>Certificados</h3>
            <p>Obtén certificados al completar tus cursos</p>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="featured-courses-section">
        <div className="section-header">
          <h2>Cursos Destacados</h2>
          <p>Los cursos más populares de nuestra plataforma</p>
        </div>
        <CourseList courses={featuredCourses} loading={loading} />
        <div className="section-footer">
          <Link to="/cursos">
            <Button variant="outline">Ver Todos los Cursos</Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>¿Listo para Empezar?</h2>
        <p>Únete hoy y accede a todos nuestros cursos de costura y tejido</p>
        <Link to="/register">
          <Button size="large">Crear Cuenta Gratis</Button>
        </Link>
      </section>
    </div>
  );
};

export default Home;