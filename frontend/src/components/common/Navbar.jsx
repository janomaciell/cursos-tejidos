import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiLogOut, FiBookOpen, FiShoppingCart } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FiBookOpen className="logo-icon" />
          <span>E-Learning Costura</span>
        </Link>

        <ul className="navbar-menu">
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/cursos">Cursos</Link></li>
          
          {isAuthenticated ? (
            <>
              <li><Link to="/mis-cursos">Mis Cursos</Link></li>
              <li className="navbar-dropdown">
                <button className="dropdown-toggle">
                  <FiUser />
                  <span>{user?.first_name || 'Usuario'}</span>
                </button>
                <ul className="dropdown-menu">
                  <li><Link to="/perfil">Mi Perfil</Link></li>
                  <li><Link to="/historial">Historial de Compras</Link></li>
                  <li>
                    <button onClick={handleLogout} className="logout-btn">
                      <FiLogOut /> Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="btn-login">Iniciar Sesión</Link></li>
              <li><Link to="/register" className="btn-register">Registrarse</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;