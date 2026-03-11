import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheck, FiX, FiClock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { coursesAPI } from '../../api/courses';
import { usePayment } from '../../hooks/usePayment';
import { useAuth } from '../../hooks/useAuth';
import CourseDetail from '../../courses/CourseDetail';
import Loader from '../../components/common/Loader';
import gsap from 'gsap';
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
  const [lessonProgress, setLessonProgress] = useState({});
  const bannerRef = useRef(null);

  useEffect(() => {
    loadCourseDetail();
    checkReturnFromPayment();

    // Cleanup: cancelar polling si el usuario sale
    return () => {
      cancelPolling();
    };
  }, [slug]);

  useEffect(() => {
    // Animar banner de resultado de pago
    if (paymentResult && bannerRef.current) {
      gsap.fromTo(bannerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.4)' }
      );
    }
  }, [paymentResult]);

  useEffect(() => {
    // Animar entrada del contenido
    if (!loading && course) {
      gsap.fromTo('.course-detail-page',
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [loading, course]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const data = await coursesAPI.getCourseBySlug(slug);
      setCourse(data);

      // Si está autenticado, verificar acceso y progreso
      if (isAuthenticated) {
        const accessData = await coursesAPI.checkCourseAccess(data.id);
        setHasAccess(accessData.has_access);

        if (accessData.has_access) {
          try {
            const progressData = await coursesAPI.getLessonProgress(data.id);
            const progressList = Array.isArray(progressData) ? progressData : (progressData?.results ?? []);
            const progressMap = {};
            progressList.forEach(p => { progressMap[p.lesson] = p; });
            setLessonProgress(progressMap);
          } catch (e) {
            console.warn('No se pudo cargar el progreso:', e);
          }
        }
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
          message: '¡Pago aprobado! Ya tienes acceso al curso.',
          title: '¡Felicitaciones!'
        });
        
        // Recargar para mostrar el contenido del curso
        loadCourseDetail();
      } else if (result.status === 'rejected') {
        setPaymentResult({ 
          status: 'rejected',
          message: 'El pago fue rechazado. Por favor intenta con otro medio de pago.',
          title: 'Pago Rechazado'
        });
      } else if (result.status === 'timeout') {
        setPaymentResult({ 
          status: 'pending',
          message: 'No pudimos verificar el pago automáticamente. Por favor revisa tu email o la sección "Mis Cursos".',
          title: 'Pago Pendiente'
        });
      }
    } else {
      setPaymentResult({
        status: 'error',
        message: result.error || 'Ocurrió un error al procesar el pago. Por favor intenta nuevamente.',
        title: 'Error en el Pago'
      });
    }

    /* Opción 2: Redirigir en la misma ventana (comentado)
    await createPayment(course.id, { openInPopup: false });
    // El usuario será redirigido a MP y volverá automáticamente
    */
  };

  const handleDismissPaymentResult = () => {
    // Animar salida del banner
    gsap.to(bannerRef.current, {
      y: -100,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        setPaymentResult(null);
        // Limpiar parámetros de URL
        navigate(`/cursos/${slug}`, { replace: true });
      }
    });
  };

  const getPaymentIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheck />;
      case 'rejected':
      case 'error':
        return <FiX />;
      case 'pending':
        return <FiClock />;
      default:
        return <FiAlertCircle />;
    }
  };

  const getPaymentAction = (status) => {
    switch (status) {
      case 'approved':
        return {
          text: 'Ver Contenido',
          onClick: () => {
            handleDismissPaymentResult();
            // Scroll al contenido del curso
            const contentSection = document.querySelector('.course-content-section');
            if (contentSection) {
              contentSection.scrollIntoView({ behavior: 'smooth' });
            }
          }
        };
      case 'rejected':
      case 'error':
        return {
          text: 'Intentar Nuevamente',
          onClick: () => {
            handleDismissPaymentResult();
            handlePurchase();
          }
        };
      case 'pending':
        return {
          text: 'Ir a Mis Cursos',
          onClick: () => {
            navigate('/mis-cursos');
          }
        };
      default:
        return null;
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <div className="course-not-found">
          <div className="not-found-icon">
            <FiAlertCircle />
          </div>
          <h2>Curso no encontrado</h2>
          <p>El curso que buscas no existe o ha sido eliminado.</p>
          <button 
            className="back-to-catalog-btn"
            onClick={() => navigate('/cursos')}
          >
            <FiArrowRight style={{ transform: 'rotate(180deg)' }} />
            Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      {/* Banner de resultado del pago */}
      {paymentResult && (
        <div 
          ref={bannerRef}
          className={`payment-result-banner ${paymentResult.status}`}
        >
          <div className="payment-banner-container">
            <div className="payment-result-content">
              <div className="payment-icon-wrapper">
                <span className="payment-icon">
                  {getPaymentIcon(paymentResult.status)}
                </span>
                <span className="icon-pulse"></span>
              </div>
              
              <div className="payment-message">
                <h3 className="payment-title">{paymentResult.title}</h3>
                <p className="payment-description">{paymentResult.message}</p>
              </div>

              <div className="payment-actions">
                {getPaymentAction(paymentResult.status) && (
                  <button
                    className="payment-action-btn"
                    onClick={getPaymentAction(paymentResult.status).onClick}
                  >
                    {getPaymentAction(paymentResult.status).text}
                    <FiArrowRight />
                  </button>
                )}
              </div>
              
              <button 
                className="dismiss-btn"
                onClick={handleDismissPaymentResult}
                aria-label="Cerrar notificación"
              >
                <FiX />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido del curso */}
      <CourseDetail
        course={course}
        hasAccess={hasAccess}
        onPurchase={handlePurchase}
        loading={paymentLoading}
        progress={lessonProgress}
      />
    </div>
  );
};

export default CourseDetailPublic;