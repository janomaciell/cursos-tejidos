import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../api/auth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { 
  FiUser, 
  FiLock, 
  FiSave, 
  FiMail, 
  FiPhone, 
  FiCheck, 
  FiX,
  FiAlertCircle,
  FiShield
} from 'react-icons/fi';
import gsap from 'gsap';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const messageRef = useRef(null);
  const formRef = useRef(null);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: ''
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    // Animación de entrada
    gsap.fromTo('.profile-container',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.2 }
    );

    gsap.fromTo('.profile-header',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.3 }
    );

    gsap.fromTo('.tab-button',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out', delay: 0.4 }
    );
  }, []);

  useEffect(() => {
    // Animar cambio de tab
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, x: activeTab === 'profile' ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  useEffect(() => {
    // Animar mensaje
    if (message.text && messageRef.current) {
      gsap.fromTo(messageRef.current,
        { opacity: 0, y: -20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.3)' }
      );

      // Auto-dismiss después de 5 segundos
      const timer = setTimeout(() => {
        dismissMessage();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    // Calcular fuerza de contraseña
    if (passwordData.new_password) {
      const strength = calculatePasswordStrength(passwordData.new_password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [passwordData.new_password]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthLabel = (strength) => {
    if (strength === 0) return '';
    if (strength < 40) return 'Débil';
    if (strength < 70) return 'Media';
    return 'Fuerte';
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 40) return '#ef4444';
    if (strength < 70) return '#f59e0b';
    return '#10b981';
  };

  const dismissMessage = () => {
    if (messageRef.current) {
      gsap.to(messageRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setMessage({ type: '', text: '' });
        }
      });
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const result = await authAPI.updateProfile(profileData);
      updateUser(result.user);

      setMessage({ 
        type: 'success', 
        text: '✓ Perfil actualizado correctamente',
        icon: <FiCheck />
      });

      // Animación de éxito en el botón
      gsap.fromTo('.btn-save',
        { scale: 1 },
        { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' }
      );
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al actualizar perfil',
        icon: <FiX />
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.new_password2) {
      setMessage({ 
        type: 'error', 
        text: 'Las contraseñas no coinciden',
        icon: <FiAlertCircle />
      });
      return;
    }

    if (passwordStrength < 40) {
      setMessage({ 
        type: 'warning', 
        text: 'La contraseña es muy débil. Usa al menos 8 caracteres, mayúsculas, minúsculas y números.',
        icon: <FiAlertCircle />
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      await authAPI.changePassword(passwordData);

      setMessage({ 
        type: 'success', 
        text: '✓ Contraseña cambiada correctamente',
        icon: <FiCheck />
      });
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password2: ''
      });

      // Animación de éxito
      gsap.fromTo('.btn-save',
        { scale: 1 },
        { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' }
      );
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al cambiar contraseña',
        icon: <FiX />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    // Animar salida del contenido actual
    gsap.to(formRef.current, {
      opacity: 0,
      x: activeTab === 'profile' ? -20 : 20,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setActiveTab(tab);
        setMessage({ type: '', text: '' });
      }
    });
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="header-content">
            <div className="user-avatar">
              <FiUser />
            </div>
            <div className="header-text">
              <h1>Mi Perfil</h1>
              <p className="header-subtitle">
                Gestiona tu información personal y configuración de seguridad
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <FiUser />
            <span>Información Personal</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => handleTabChange('password')}
          >
            <FiShield />
            <span>Seguridad</span>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div ref={messageRef} className={`message-card ${message.type}`}>
            <div className="message-icon">
              {message.icon}
            </div>
            <div className="message-content">
              <p>{message.text}</p>
            </div>
            <button 
              className="message-dismiss"
              onClick={dismissMessage}
              aria-label="Cerrar mensaje"
            >
              <FiX />
            </button>
          </div>
        )}

        {/* Profile Form */}
        {activeTab === 'profile' && (
          <div ref={formRef}>
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-section">
                <div className="section-header">
                  <FiUser />
                  <h2>Información Personal</h2>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <Input
                      label="Nombre"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                      icon={<FiUser />}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      label="Apellido"
                      name="last_name"
                      value={profileData.last_name}
                      onChange={handleProfileChange}
                      icon={<FiUser />}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <Input
                    label="Email"
                    name="email"
                    value={user?.email || ''}
                    icon={<FiMail />}
                    disabled
                  />
                  <p className="input-hint">
                    <FiAlertCircle />
                    El email no puede ser modificado
                  </p>
                </div>

                <div className="form-group">
                  <Input
                    label="Teléfono"
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    icon={<FiPhone />}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
              </div>

              <div className="form-actions">
                <Button 
                  type="submit" 
                  className="btn-save"
                  disabled={loading}
                  size="large"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Password Form */}
        {activeTab === 'password' && (
          <div ref={formRef}>
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <div className="form-section">
                <div className="section-header">
                  <FiShield />
                  <h2>Cambiar Contraseña</h2>
                </div>

                <div className="security-info">
                  <FiAlertCircle />
                  <div>
                    <strong>Mantén tu cuenta segura</strong>
                    <p>Usa al menos 8 caracteres con una combinación de letras, números y símbolos.</p>
                  </div>
                </div>

                <div className="form-group">
                  <Input
                    label="Contraseña Actual"
                    name="old_password"
                    type="password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    icon={<FiLock />}
                    required
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Nueva Contraseña"
                    name="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    icon={<FiLock />}
                    required
                  />
                  
                  {passwordData.new_password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div 
                          className="strength-fill"
                          style={{ 
                            width: `${passwordStrength}%`,
                            backgroundColor: getPasswordStrengthColor(passwordStrength)
                          }}
                        ></div>
                      </div>
                      <span 
                        className="strength-label"
                        style={{ color: getPasswordStrengthColor(passwordStrength) }}
                      >
                        {getPasswordStrengthLabel(passwordStrength)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <Input
                    label="Confirmar Nueva Contraseña"
                    name="new_password2"
                    type="password"
                    value={passwordData.new_password2}
                    onChange={handlePasswordChange}
                    icon={<FiLock />}
                    required
                  />
                  
                  {passwordData.new_password2 && (
                    <p className={`input-hint ${passwordData.new_password === passwordData.new_password2 ? 'success' : 'error'}`}>
                      {passwordData.new_password === passwordData.new_password2 ? (
                        <>
                          <FiCheck />
                          Las contraseñas coinciden
                        </>
                      ) : (
                        <>
                          <FiX />
                          Las contraseñas no coinciden
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <Button 
                  type="submit" 
                  className="btn-save"
                  disabled={loading}
                  size="large"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <FiShield />
                      Cambiar Contraseña
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;