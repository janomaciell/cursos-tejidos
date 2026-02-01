export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

export const DIFFICULTY_LEVELS = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado'
};

export const PAYMENT_STATUS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
};

export const ROUTES = {
  HOME: '/',
  COURSES: '/cursos',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  MY_COURSES: '/mis-cursos',
  PROFILE: '/perfil',
  PURCHASE_HISTORY: '/historial'
};