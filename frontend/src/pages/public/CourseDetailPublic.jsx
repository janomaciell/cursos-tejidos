import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';
import { coursesAPI } from '../../api/courses';
import { usePayment } from '../../hooks/usePayment';
import { useAuth } from '../../hooks/useAuth';
import CourseDetail from '../../courses/CourseDetail';
import Loader from '../../components/common/Loader';
import './CourseDetailPublic.css';

const CourseDetailPublic = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { createPayment, checkPendingPayment, cancelPolling, loading: paymentLoading } = usePayment();
  
  const [course, setCourse] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    loadCourseDetail();
    checkReturnFromPayment();

    // Cleanup: cancelar polling si el usuario sale
    return () => {
      cancelPolling();
    };
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

  const checkReturnFromPayment = async () => {
    const status = searchParams.get('status');
    
    if (status && isAuthenticated) {
      // Venimos de Mercado Pago, verificar el pago
      const payment = await checkPendingPayment();
      
      if (payment) {
        setPaymentResult(payment);
        
        // Si fue aprobado, actualizar acceso
        if (payment.status === 'approved') {
          setHasAccess(true);
        }
      }
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/cursos/${slug}` } });
      return;
    }

    // Opción 1: Abrir en popup con polling automático (RECOMENDADO)
    const result = await createPayment(course.id, { openInPopup: true });
    
    if (result.success) {
      if (result.status === 'approved') {
        // Pago aprobado
        setHasAccess(true);
        setPaymentResult({ 
          status: 'approved',
          message: '¡Pago aprobado! Ya tienes acceso al curso.' 
        });
        
        // Recargar para mostrar el contenido del curso
        loadCourseDetail();
      } else if (result.status === 'rejected') {
        setPaymentResult({ 
          status: 'rejected',
          message: 'El pago fue rechazado. Por favor intenta con otro medio de pago.' 
        });
      } else if (result.status === 'timeout') {
        setPaymentResult({ 
          status: 'pending',
          message: 'No pudimos verificar el pago automáticamente. Por favor revisa tu email o sección "Mis Cursos".' 
        });
      }
    } else {
      alert(`Error: ${result.error}`);
    }

    /* Opción 2: Redirigir en la misma ventana (comentado)
    await createPayment(course.id, { openInPopup: false });
    // El usuario será redirigido a MP y volverá automáticamente
    */
  };

  const handleDismissPaymentResult = () => {
    setPaymentResult(null);
    // Limpiar parámetros de URL
    navigate(`/cursos/${slug}`, { replace: true });
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
      {/* Mostrar resultado del pago si existe */}
      {paymentResult && (
        <div className={`payment-result-banner ${paymentResult.status}`}>
          <div className="payment-result-content">
            {paymentResult.status === 'approved' && (
              <>
                <span className="icon"><FiCheck /></span>
                <div className="message">
                  <strong>¡Pago Aprobado!</strong>
                  <p>{paymentResult.message}</p>
                </div>
              </>
            )}
            
            {paymentResult.status === 'rejected' && (
              <>
                <span className="icon"><FiX /></span>
                <div className="message">
                  <strong>Pago Rechazado</strong>
                  <p>{paymentResult.message}</p>
                </div>
              </>
            )}
            
            {paymentResult.status === 'pending' && (
              <>
                <span className="icon"><FiClock /></span>
                <div className="message">
                  <strong>Pago Pendiente</strong>
                  <p>{paymentResult.message}</p>
                </div>
              </>
            )}
            
            <button 
              className="dismiss-btn"
              onClick={handleDismissPaymentResult}
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      <CourseDetail
        course={course}
        hasAccess={hasAccess}
        onPurchase={handlePurchase}
        loading={paymentLoading}
      />
    </div>
  );
};

export default CourseDetailPublic;