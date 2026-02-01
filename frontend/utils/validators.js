export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  export const validatePassword = (password) => {
    // Mínimo 8 caracteres
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    return null;
  };
  
  export const validatePhone = (phone) => {
    const re = /^\+?[\d\s\-()]+$/;
    if (!re.test(phone)) {
      return 'Formato de teléfono inválido';
    }
    return null;
  };
  
  export const validateRequired = (value, fieldName = 'Este campo') => {
    if (!value || value.trim() === '') {
      return `${fieldName} es requerido`;
    }
    return null;
  };