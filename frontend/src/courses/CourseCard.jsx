import { Link } from 'react-router-dom';
import { FiClock, FiUsers, FiBook, FiShoppingCart, FiCheck } from 'react-icons/fi';
import Card from '../components/common/Card';
import NgrokImage from '../components/common/NgrokImage';
import { useCart } from '../context/CartContext';
import './CourseCard.css';

const CourseCard = ({ course }) => {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(course.id);

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

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) {
      addItem({
        id: course.id,
        title: course.title,
        price: course.price,
        thumbnail: course.cover_image,
        level: course.difficulty
      });
    }
  };

  return (
    <Card hover className="course-card">
      <Link to={`/cursos/${course.slug}`} className="course-card-link">
        <div className="course-image">
          <NgrokImage 
            src={course.cover_image}
            alt={course.title}
          />
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
              <span>{course.total_students} est.</span>
            </div>
          </div>

          <div className="course-footer">
            <span className="course-price">{formatPrice(course.price)}</span>
            <button 
              className={`cart-add-btn ${inCart ? 'in-cart' : ''}`}
              onClick={handleAddToCart}
              title={inCart ? "En el carrito" : "Añadir al carrito"}
            >
              {inCart ? <FiCheck /> : <FiShoppingCart />}
            </button>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default CourseCard;