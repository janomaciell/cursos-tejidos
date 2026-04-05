import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiBook, FiStar, FiPlay, FiCheckCircle, FiLock, FiAward, FiDownload, FiShield, FiShoppingCart } from 'react-icons/fi';
import Button from '../components/common/Button';
import NgrokImage from '../components/common/NgrokImage';
import { useCart } from '../context/CartContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './CourseDetail.css';

gsap.registerPlugin(ScrollTrigger);

const CourseDetail = ({ course, hasAccess, onPurchase, loading, progress = {} }) => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    // Animaciones de entrada
    const tl = gsap.timeline({ delay: 0.2 });

    // Hero animation
    tl.fromTo('.course-hero-content',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo('.course-hero-sidebar',
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    )
    .fromTo('.meta-item',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(1.2)' },
      '-=0.4'
    );

    // Modules animation on scroll
    gsap.fromTo('.module-item',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.course-modules',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  /* Construye lista plana de todas las lecciones en orden */
  const getAllLessonsOrdered = () => {
    const all = [];
    (course.modules || []).forEach(m =>
      (m.lessons || []).forEach(l => all.push(l))
    );
    return all;
  };

  /* Verifica si una lección está desbloqueada:
     La primera siempre está libre; las demás requieren que la anterior esté completada */
  const isLessonUnlocked = (targetLesson) => {
    const all = getAllLessonsOrdered();
    const idx = all.findIndex(l => l.id === targetLesson.id);
    if (idx <= 0) return true; // primera lección siempre accesible
    const prev = all[idx - 1];
    return progress[prev.id]?.completed === true;
  };

  const handleLessonClick = (lesson) => {
    if (!hasAccess) return;
    if (!isLessonUnlocked(lesson)) return; // bloqueada
    navigate(`/curso/${course.id}/player?lesson=${lesson.id}`);
  };

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

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  return (
    <div className="course-detail">
      {/* Hero Section */}
        <div className="course-hero" ref={heroRef}>
        <div className="hero-background-pattern"></div>
        
        <div className="course-hero-content">
          <div className="course-header">
            <div 
              className="difficulty-badge"
              style={{ background: getDifficultyColor(course.difficulty) }}
            >
              <FiStar />
              {getDifficultyText(course.difficulty)}
            </div>
            
            {hasAccess && (
              <div className="access-badge">
                <FiCheckCircle />
                Tienes acceso
              </div>
            )}
          </div>

          <h1 className="course-title-curso-public">{course.title}</h1>
          <p className="course-short-desc-curso-public">{course.short_description}</p>

          <div className="course-meta">
            <div className="meta-item">
              <FiClock />
              <span>{course.duration_hours}h de contenido</span>
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
              <FiAward />
              <span>Certificado incluido</span>
            </div>
          </div>
        </div>

        <div className="course-hero-sidebar">
          <div className="sidebar-card">
            <div className="course-preview-image">
              <NgrokImage 
                src={course.cover_image}
                alt={course.title}
              />
            </div>

            {hasAccess ? (
              <div className="access-section">
                <Button 
                  size="large" 
                  className="btn-access-course"
                  onClick={() => window.location.href = `/curso/${course.id}/player`}
                >
                  <FiPlay />
                  Comenzar Curso
                </Button>
              </div>
            ) : (
              <div className="purchase-section">
                <div className="price-display">
                  <div className="price-label">Inversión única</div>
                  <div className="price">{formatPrice(course.price)}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                  <Button 
                    size="large" 
                    className="btn-purchase"
                    onClick={onPurchase}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        Comprar Ahora
                      </>
                    )}
                  </Button>

                  <Button
                    size="large"
                    className={`btn-add-to-cart ${isInCart(course.id) ? 'in-cart' : ''}`}
                    onClick={() => {
                      if (!isInCart(course.id)) {
                        addItem({
                          id: course.id,
                          title: course.title,
                          price: course.price,
                          thumbnail: course.cover_image,
                          level: course.difficulty
                        });
                      }
                    }}
                    style={{ width: '100%', background: 'white', color: '#fc5c0d', border: '2px solid #fc5c0d' }}
                  >
                    {isInCart(course.id) ? (
                      <><FiCheckCircle /> En el carrito</>
                    ) : (
                      <><FiShoppingCart /> Añadir al carrito</>
                    )}
                  </Button>
                </div>

                <div className="purchase-benefits">
                  <div className="benefit-item">
                    <FiCheckCircle />
                    <span>Acceso de por vida</span>
                  </div>

                  <div className="benefit-item">
                    <FiShield />
                    <span>Soporte directo por WhatsApp</span>
                  </div>
                  <div className="benefit-item">
                    <FiCheckCircle />
                    <span>Actualizaciones gratuitas</span>
                  </div>
                </div>

                <div className="trust-badge">
                  <FiShield />
                  <span>Pago 100% seguro</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="course-content-section" ref={contentRef}>
        <div className="content-container">
          {/* What you'll learn */}
          {course.learning_objectives && course.learning_objectives.length > 0 && (
            <div className="learning-objectives-card">
              <h2 className="section-title">
                <FiCheckCircle />
                Lo que aprenderás
              </h2>
              <div className="objectives-grid">
                {course.learning_objectives.map((objective, index) => (
                  <div key={index} className="objective-item">
                    <FiCheckCircle className="check-icon" />
                    <span>{objective}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="course-description-card">
            <h2 className="section-title">
              <FiBook />
              Sobre este curso
            </h2>
            <p className="description-text">{course.description}</p>
          </div>

          {/* Course Modules */}
          <div className="course-modules-card">
            <h2 className="section-title">
              <FiDownload />
              Contenido del Curso
            </h2>
            
            {course.modules && course.modules.length > 0 ? (
              <div className="modules-list">
                {course.modules.map((module, index) => (
                  <div key={module.id} className="module-item">
                    <div className="module-header">
                      <div className="module-number">
                        Módulo {index + 1}
                      </div>
                      <h3 className="module-title">{module.title}</h3>
                      <div className="module-stats">
                        <span className="module-lessons">
                          {module.lessons.length} lecciones
                        </span>
                        <span className="module-duration">
                          {module.lessons.reduce((acc, lesson) => acc + (lesson.duration_minutes || 0), 0)} min
                        </span>
                      </div>
                    </div>
                    
                    {module.description && (
                      <p className="module-description">{module.description}</p>
                    )}
                    
                    <div className="lessons-list">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const unlocked = !hasAccess ? false : isLessonUnlocked(lesson);
                        const clickable = hasAccess && unlocked;
                        return (
                        <div 
                          key={lesson.id} 
                          className={`lesson-item ${lesson.is_preview ? 'preview' : ''} ${hasAccess ? 'has-access' : ''} ${clickable ? 'clickable' : ''} ${hasAccess && !unlocked ? 'locked-sequential' : ''}`}
                          onClick={() => handleLessonClick(lesson)}
                          title={hasAccess && !unlocked ? 'Debés completar la lección anterior para desbloquear esta' : ''}
                          style={{ cursor: clickable ? 'pointer' : 'default' }}
                        >
                          <div className="lesson-number">
                            {lessonIndex + 1}
                          </div>
                          
                          <div className="lesson-icon">
                            {hasAccess && !unlocked ? (
                              <FiLock />
                            ) : lesson.is_preview || hasAccess ? (
                              <FiPlay />
                            ) : (
                              <FiLock />
                            )}
                          </div>
                          
                          <div className="lesson-content">
                            <span className="lesson-title">{lesson.title}</span>
                            {lesson.description && (
                              <span className="lesson-desc">{lesson.description}</span>
                            )}
                          </div>
                          
                          <div className="lesson-meta">
                            <span className="lesson-duration">
                              <FiClock />
                              {lesson.duration_minutes} min
                            </span>
                            {lesson.is_preview && (
                              <span className="preview-badge">
                                Gratis
                              </span>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-modules">
                <FiBook />
                <p>El contenido del curso estará disponible próximamente</p>
              </div>
            )}
          </div>

          {/* CTA Bottom */}
          {!hasAccess && (
            <div className="cta-bottom-card">
              <div className="cta-content">
                <h3>¿Lista para comenzar tu transformación?</h3>
                <p>Únete a {course.total_students} estudiantes que ya están aprendiendo</p>
                <div className="cta-price">{formatPrice(course.price)}</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Button 
                  size="large" 
                  className="btn-purchase-bottom"
                  onClick={onPurchase}
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : 'Comprar Curso'}
                </Button>
                <Button
                  size="large"
                  className={`btn-add-to-cart ${isInCart(course.id) ? 'in-cart' : ''}`}
                  onClick={() => {
                    if (!isInCart(course.id)) {
                      addItem({
                        id: course.id,
                        title: course.title,
                        price: course.price,
                        thumbnail: course.cover_image,
                        level: course.difficulty
                      });
                    }
                  }}
                  style={{ background: 'white', color: '#fc5c0d', border: '2px solid #fc5c0d' }}
                >
                  {isInCart(course.id) ? (
                    <><FiCheckCircle /> En el carrito</>
                  ) : (
                    <><FiShoppingCart /> Añadir al carrito</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;