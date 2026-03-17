import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RegisterForm from '../../components/auth/RegisterForm';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { FiArrowRight, FiCheck, FiShield, FiClock, FiAward } from 'react-icons/fi';
import gsap from 'gsap';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');

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
    .fromTo('.feature-card',
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.2)' },
      '-=0.4'
    );

    return () => tl.kill();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError('');
      const result = await register(formData);

      if (result.success) {
        // Animación de éxito
        gsap.to('.auth-right', {
          scale: 0.98,
          opacity: 0.5,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            navigate('/');
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
      setError('Error al crear la cuenta. Por favor intenta nuevamente.');
      gsap.fromTo('.auth-form-container',
        { x: -10 },
        { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: 'power1.inOut' }
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FiClock />,
      title: 'Aprendizaje a tu propio ritmo',
      description: 'Accedé a todas las clases cuando quieras, las veces que necesites, sin horarios fijos ni presiones.'
    },
    {
      icon: <FiAward />,
      title: 'Técnica Profesional',
      description: 'Dominá el arte del crochet con métodos probados que garantizan resultados impecables, incluso si recién empezás.'
    },
    {
      icon: <FiShield />,
      title: 'Soporte directo por WhatsApp',
      description: 'No estás sola: te acompaño personalmente por WhatsApp para que resuelvas cualquier duda mientras tejés.'
    }
  ];

  const steps = [
    { number: '1', text: 'Crea tu cuenta' },
    { number: '2', text: 'Elige tu curso' },
    { number: '3', text: 'Comienza a aprender' }
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
          {/* Left Side - Value Proposition */}
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
              <p className="brand-tagline">Transforma tu pasión en habilidad</p>
            </div>

            <div className="register-value">
              <h3 className="value-title">Comienza tu viaje hoy</h3>
              <p className="value-text">
                Únete a más de 500 alumnas que ya están creando sus propias prendas 
                y construyendo su futuro en la costura.
              </p>
            </div>

            <div className="register-steps">
              <h4 className="steps-title">Es muy simple:</h4>
              <div className="steps-list">
                {steps.map((step, index) => (
                  <div key={index} className="step-item">
                    <div className="step-number">{step.number}</div>
                    <span className="step-text">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-features">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-content">
                    <h4 className="feature-title">{feature.title}</h4>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="trust-badges">
              <div className="trust-badge">
                <FiCheck />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="trust-badge">
                <FiShield />
                <span>100% seguro</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-right">
            <div className="auth-form-container">
              <div className="form-header">
                <h2 className="form-title">Crea tu cuenta gratis</h2>
                <p className="form-subtitle">
                  Comienza a aprender en menos de 2 minutos
                </p>
              </div>

              <RegisterForm 
                onSubmit={handleSubmit} 
                loading={loading} 
                error={error} 
              />

              <div className="form-footer">
                <p className="footer-text">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="footer-link">
                    Inicia sesión
                    <FiArrowRight />
                  </Link>
                </p>
              </div>

              <div className="form-divider">
                <span>O regístrate con</span>
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
                        onComplete: () => navigate('/'),
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

              <p className="terms-text">
                Al registrarte, aceptas nuestros{' '}
                <a href="/terms" className="terms-link">Términos de Servicio</a>
                {' '}y{' '}
                <a href="/privacy" className="terms-link">Política de Privacidad</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;