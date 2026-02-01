import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI } from '../../api/courses';
import { paymentsAPI } from '../../api/payments';
import { useAuth } from '../../hooks/useAuth';
import CourseDetail from '../../courses/CourseDetail';
import Loader from '../../components/common/Loader';
import './CourseDetailPublic.css';

const CourseDetailPublic = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadCourseDetail();
  }, [slug]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const data = await coursesAPI.getCourseBySlug(slug);
      setCourse(data);

      // Si está autenticado, verificar acceso
      if (isAuthenticated) {
        const accessData = await coursesAPI.checkCourseAccess(data.id);
        setHasAccess(accessData.has_access);
      }
    } catch (error) {
      console.error('Error al cargar curso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/cursos/${slug}` } });
      return;
    }

    try {
      setPurchasing(true);
      const result = await paymentsAPI.createPayment(course.id);
      
      // Redirigir a Mercado Pago
      window.location.href = result.init_point;
    } catch (error) {
      console.error('Error al crear pago:', error);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!course) {
    return (
      <div className="course-not-found">
        <h2>Curso no encontrado</h2>
        <p>El curso que buscas no existe o ha sido eliminado.</p>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <CourseDetail
        course={course}
        hasAccess={hasAccess}
        onPurchase={handlePurchase}
        loading={purchasing}
      />
    </div>
  );
};

export default CourseDetailPublic;