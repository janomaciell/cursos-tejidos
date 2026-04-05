import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import {
  FiUser, FiLogOut, FiMenu, FiX, FiShoppingCart,
  FiHome, FiBook, FiBookOpen
} from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, setIsOpen: openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    // Initialize state properly on load
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const isHome = location.pathname === '/';
  const navbarClass = `navbar ${isHome ? 'navbar--home' : ''} ${isHome && !scrolled ? 'navbar--transparent' : ''}`;

  return (
    <>
      <nav className={navbarClass}>
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

          {/* Desktop navigation */}
          <ul className="navbar-menu">
            <li><Link to="/" className={isActive('/')}>Inicio</Link></li>
            <li><Link to="/cursos" className={isActive('/cursos')}>Cursos</Link></li>
            <li><Link to="/contacto" className={isActive('/contacto')}>Contacto</Link></li>

            {isAuthenticated ? (
              <>
                <li><Link to="/mis-cursos" className={isActive('/mis-cursos')}>Mis Cursos</Link></li>
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

            {/* Cart icon always visible in desktop */}
            <li>
              <button
                type="button"
                className="navbar-cart-btn"
                onClick={() => openCart(true)}
                aria-label="Abrir carrito"
                id="navbar-cart-btn"
              >
                <FiShoppingCart />
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
              </button>
            </li>
          </ul>

          {/* Mobile: cart + hamburger */}
          <div className="navbar-mobile-actions">
            <button
              type="button"
              className="navbar-cart-btn"
              onClick={() => openCart(true)}
              aria-label="Abrir carrito"
            >
              <FiShoppingCart />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </button>
            <button
              type="button"
              className="navbar-toggle"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          {/* Mobile full menu (hamburger) */}
          <ul className={`navbar-menu-mobile ${menuOpen ? 'navbar-menu--open' : ''}`}>
            <li><Link to="/" onClick={closeMenu}>Inicio</Link></li>
            <li><Link to="/cursos" onClick={closeMenu}>Cursos</Link></li>
            <li><Link to="/contacto" onClick={closeMenu}>Contacto</Link></li>

            {isAuthenticated ? (
              <>
                <li><Link to="/mis-cursos" onClick={closeMenu}>Mis Cursos</Link></li>
                <li><Link to="/perfil" onClick={closeMenu}>Mi Perfil</Link></li>
                <li><Link to="/historial" onClick={closeMenu}>Historial de Compras</Link></li>
                <li>
                  <button type="button" onClick={handleLogout} className="logout-btn">
                    <FiLogOut /> Cerrar Sesión
                  </button>
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

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="bottom-nav" aria-label="Navegación principal">
        <Link to="/" className={`bottom-nav-item ${isActive('/')}`}>
          <FiHome className="bottom-nav-icon" />
          <span>Inicio</span>
        </Link>

        <Link to="/cursos" className={`bottom-nav-item ${isActive('/cursos')}`}>
          <FiBookOpen className="bottom-nav-icon" />
          <span>Cursos</span>
        </Link>

        {isAuthenticated && (
          <Link to="/mis-cursos" className={`bottom-nav-item ${isActive('/mis-cursos')}`}>
            <FiBook className="bottom-nav-icon" />
            <span>Mis Cursos</span>
          </Link>
        )}

        <button
          type="button"
          className="bottom-nav-item bottom-nav-cart"
          onClick={() => openCart(true)}
          aria-label="Abrir carrito"
        >
          <div className="bottom-nav-cart-wrapper">
            <FiShoppingCart className="bottom-nav-icon" />
            {totalItems > 0 && (
              <span className="bottom-nav-badge">{totalItems}</span>
            )}
          </div>
          <span>Carrito</span>
        </button>

        {!isAuthenticated && (
          <Link to="/login" className={`bottom-nav-item ${isActive('/login')}`}>
            <FiUser className="bottom-nav-icon" />
            <span>Ingresar</span>
          </Link>
        )}

        {isAuthenticated && (
          <Link to="/perfil" className={`bottom-nav-item ${isActive('/perfil')}`}>
            <FiUser className="bottom-nav-icon" />
            <span>Perfil</span>
          </Link>
        )}
      </nav>
    </>
  );
};

export default Navbar;