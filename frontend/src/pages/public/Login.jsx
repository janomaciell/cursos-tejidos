import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from '../../components/auth/LoginForm';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { FiArrowRight, FiCheck, FiStar, FiUsers } from 'react-icons/fi';
import gsap from 'gsap';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');

  const from = location.state?.from || '/';

  useEffect(() => {
    // Animaciones de entrada
    const tl = gsap.timeline({ delay: 0.2 });
    
    tl.fromTo('.auth-left',
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo('.auth-right',
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    )
    .fromTo('.benefit-item',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' },
      '-=0.4'
    );

    return () => tl.kill();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError('');
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Animación de éxito antes de navegar
        gsap.to('.auth-right', {
          scale: 0.98,
          opacity: 0.5,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            navigate(from, { replace: true });
          }
        });
      } else {
        setError(result.error);
        // Shake animation en error
        gsap.fromTo('.auth-form-container',
          { x: -10 },
          { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: 'power1.inOut' }
        );
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor intenta nuevamente.');
      gsap.fromTo('.auth-form-container',
        { x: -10 },
        { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: 'power1.inOut' }
      );
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: <FiCheck />, text: 'Acceso inmediato a todos los cursos' },
    { icon: <FiStar />, text: 'Contenido actualizado constantemente' },
    { icon: <FiUsers />, text: 'Comunidad activa de alumnas' }
  ];

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-grid">
          {/* Left Side - Brand & Benefits */}
          <div className="auth-left">
            <div className="auth-brand">
              <div className="brand-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="28" fill="white" fillOpacity="0.1"/>
                  <path d="M30 15L35 25H25L30 15Z" fill="white"/>
                  <path d="M30 45L35 35H25L30 45Z" fill="white"/>
                  <circle cx="30" cy="30" r="5" fill="white"/>
                </svg>
              </div>
              <h1 className="brand-title">Tejiendo con Andy</h1>
              <p className="brand-tagline">Tu camino hacia la maestría en costura</p>
            </div>

            <div className="auth-benefits">
              <h3 className="benefits-title">¿Por qué unirte?</h3>
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <div className="benefit-icon">{benefit.icon}</div>
                  <span className="benefit-text">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="auth-testimonial">
              <div className="testimonial-quote">"</div>
              <p className="testimonial-text">
                Los cursos cambiaron mi vida. Ahora tengo mi propio emprendimiento de costura.
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">M</div>
                <div className="author-info">
                  <p className="author-name">María González</p>
                  <p className="author-role">Alumna destacada</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-right">
            <div className="auth-form-container">
              <div className="form-header">
                <h2 className="form-title">¡Bienvenida de vuelta!</h2>
                <p className="form-subtitle">
                  Ingresa tus datos para continuar aprendiendo
                </p>
              </div>

              <LoginForm 
                onSubmit={handleSubmit} 
                loading={loading} 
                error={error} 
              />

              <div className="form-footer">
                <p className="footer-text">
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register" className="footer-link">
                    Regístrate gratis
                    <FiArrowRight />
                  </Link>
                </p>
              </div>

              <div className="form-divider">
                <span>O continúa con</span>
              </div>

              <div className="social-login social-login-single">
                <GoogleLoginButton
                  onSuccess={async (credential) => {
                    setGoogleError('');
                    const result = await loginWithGoogle(credential);
                    if (result.success) {
                      gsap.to('.auth-right', {
                        scale: 0.98,
                        opacity: 0.5,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => navigate(from, { replace: true }),
                      });
                    } else {
                      setGoogleError(result.error);
                    }
                  }}
                  onError={(msg) => setGoogleError(msg)}
                  disabled={loading}
                />
                {googleError && (
                  <p className="social-error">{googleError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;