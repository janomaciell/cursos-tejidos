import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

// Public Pages
import Home from '../pages/public/Home';
import CourseCatalog from '../pages/public/CourseCatalog';
import CourseDetailPublic from '../pages/public/CourseDetailPublic';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import PaymentResult from '../pages/public/PaymentResult';
import ComoFunciona from '../pages/public/ComoFunciona';

// Private Pages
import Dashboard from '../pages/private/Dashboard';
import MyCourses from '../pages/private/MyCourses';
import CoursePlayer from '../pages/private/CoursePlayer';
import Profile from '../pages/private/Profile';
import PurchaseHistory from '../pages/private/PurchaseHistory';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/cursos" element={<CourseCatalog />} />
      <Route path="/cursos/:slug" element={<CourseDetailPublic />} />
      <Route path="/como-funciona" element={<ComoFunciona />} />
      
      <Route 
        path="/login" 
        element={
          <PublicRoute redirectIfAuthenticated>
            <Login />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <PublicRoute redirectIfAuthenticated>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Mercado Pago redirige aquí después del pago; debe estar protegida para llamar al backend */}
      <Route path="/payment-success" element={<PrivateRoute><PaymentResult /></PrivateRoute>} />
      <Route path="/payment-failure" element={<PrivateRoute><PaymentResult /></PrivateRoute>} />
      <Route path="/payment-pending" element={<PrivateRoute><PaymentResult /></PrivateRoute>} />

      {/* Private Routes */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/mis-cursos" 
        element={
          <PrivateRoute>
            <MyCourses />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/curso/:courseId/player" 
        element={
          <PrivateRoute>
            <CoursePlayer />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/perfil" 
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/historial" 
        element={
          <PrivateRoute>
            <PurchaseHistory />
          </PrivateRoute>
        } 
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// 404 Component
const NotFound = () => {
  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div>
        <h1 style={{ fontSize: '4rem', color: '#6366f1' }}>404</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Página no encontrada</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>La página que buscas no existe.</p>
        <a 
          href="/" 
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            background: '#6366f1',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}
        >
          Volver al Inicio
        </a>
      </div>
    </div>
  );
};

export default AppRoutes;