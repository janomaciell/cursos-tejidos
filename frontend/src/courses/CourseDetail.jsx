import { FiClock, FiUsers, FiBook, FiStar } from 'react-icons/fi';
import Button from '../components/common/Button';
import './CourseDetail.css';

const CourseDetail = ({ course, hasAccess, onPurchase, loading }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
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
    <div className="course-detail">
      <div className="course-hero">
        <div className="course-hero-content">
          <h1>{course.title}</h1>
          <p className="course-short-desc">{course.short_description}</p>

          <div className="course-meta">
            <div className="meta-item">
              <FiClock />
              <span>{course.duration_hours} horas</span>
            </div>
            <div className="meta-item">
              <FiBook />
              <span>{course.total_lessons} lecciones</span>
            </div>
            <div className="meta-item">
              <FiUsers />
              <span>{course.total_students} estudiantes</span>
            </div>
            <div className="meta-item">
              <FiStar />
              <span>{getDifficultyText(course.difficulty)}</span>
            </div>
          </div>

          <div className="course-actions">
            {hasAccess ? (
              <Button size="large" onClick={() => window.location.href = `/curso/${course.id}/player`}>
                Ir al Curso
              </Button>
            ) : (
              <>
                <div className="price-section">
                  <span className="price">{formatPrice(course.price)}</span>
                </div>
                <Button 
                  size="large" 
                  onClick={onPurchase}
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : 'Comprar Curso'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="course-hero-image">
          <img src={course.cover_image} alt={course.title} />
        </div>
      </div>

      <div className="course-content-section">
        <div className="course-description">
          <h2>Descripción del Curso</h2>
          <p>{course.description}</p>
        </div>

        <div className="course-modules">
          <h2>Contenido del Curso</h2>
          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module, index) => (
              <div key={module.id} className="module-item">
                <h3>
                  Módulo {index + 1}: {module.title}
                </h3>
                <p>{module.description}</p>
                <div className="lessons-list">
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className="lesson-item">
                      <FiBook />
                      <span>{lesson.title}</span>
                      <span className="lesson-duration">{lesson.duration_minutes} min</span>
                      {lesson.is_preview && (
                        <span className="preview-badge">Vista previa</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>No hay módulos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;