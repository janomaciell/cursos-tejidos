import { Link } from 'react-router-dom';
import { FiClock, FiUsers, FiBook } from 'react-icons/fi';
import Card from '../components/common/Card';
import './CourseCard.css';

const CourseCard = ({ course }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  const getDifficultyText = (difficulty) => {
    const texts = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado'
    };
    return texts[difficulty] || difficulty;
  };

  return (
    <Card hover className="course-card">
      <Link to={`/cursos/${course.slug}`} className="course-card-link">
        <div className="course-image">
          <img src={course.cover_image} alt={course.title} />
          {course.is_featured && (
            <span className="featured-badge">Destacado</span>
          )}
          <span 
            className="difficulty-badge"
            style={{ background: getDifficultyColor(course.difficulty) }}
          >
            {getDifficultyText(course.difficulty)}
          </span>
        </div>

        <div className="course-content">
          <h3 className="course-title">{course.title}</h3>
          <p className="course-description">{course.short_description}</p>

          <div className="course-stats">
            <div className="stat">
              <FiClock />
              <span>{course.duration_hours}h</span>
            </div>
            <div className="stat">
              <FiBook />
              <span>{course.total_lessons} lecciones</span>
            </div>
            <div className="stat">
              <FiUsers />
              <span>{course.total_students} estudiantes</span>
            </div>
          </div>

          <div className="course-footer">
            <span className="course-price">{formatPrice(course.price)}</span>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default CourseCard;