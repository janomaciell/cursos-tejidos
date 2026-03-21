import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      {menuOpen && (
        <button
          type="button"
          className="navbar-backdrop"
          aria-label="Cerrar menú"
          onClick={closeMenu}
        />
      )}
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src="/img/logoheader.png" alt="Tejiendo con Andy" className="navbar-logo-img" />
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <ul className={`navbar-menu ${menuOpen ? 'navbar-menu--open' : ''}`}>
          <li><Link to="/" onClick={closeMenu}>Inicio</Link></li>
          <li><Link to="/cursos" onClick={closeMenu}>Cursos</Link></li>
          <li><Link to="/contacto" onClick={closeMenu}>Contacto</Link></li>
          
          {isAuthenticated ? (
            <>
              <li><Link to="/mis-cursos" onClick={closeMenu}>Mis Cursos</Link></li>
              <li className="navbar-dropdown">
                <button className="dropdown-toggle" type="button">
                  <FiUser />
                  <span>{user?.first_name || 'Usuario'}</span>
                </button>
                <ul className="dropdown-menu">
                  <li><Link to="/perfil" onClick={closeMenu}>Mi Perfil</Link></li>
                  <li><Link to="/historial" onClick={closeMenu}>Historial de Compras</Link></li>
                  <li>
                    <button type="button" onClick={handleLogout} className="logout-btn">
                      <FiLogOut /> Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="btn-login" onClick={closeMenu}>Iniciar Sesión</Link></li>
              <li><Link to="/register" className="btn-register" onClick={closeMenu}>Registrarse</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;