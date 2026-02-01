import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import './AuthForms.css';

const RegisterForm = ({ onSubmit, loading, error }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar error del campo
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Las contraseñas no coinciden';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Crear Cuenta</h2>
      
      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <div className="form-row">
        <Input
          type="text"
          label="Nombre"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder="Juan"
          required
        />

        <Input
          type="text"
          label="Apellido"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder="Pérez"
          required
        />
      </div>

      <Input
        type="email"
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="tu@email.com"
        required
      />

      <Input
        type="tel"
        label="Teléfono"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="+54 9 11 1234-5678"
      />

      <Input
        type="password"
        label="Contraseña"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="••••••••"
        error={errors.password}
        required
      />

      <Input
        type="password"
        label="Confirmar Contraseña"
        name="password2"
        value={formData.password2}
        onChange={handleChange}
        placeholder="••••••••"
        error={errors.password2}
        required
      />

      <Button type="submit" fullWidth disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Registrarse'}
      </Button>

      <p className="auth-link">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
      </p>
    </form>
  );
};

export default RegisterForm;