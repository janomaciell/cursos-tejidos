import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiX, FiTrash2, FiArrowRight, FiBook } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { paymentsAPI } from '../../api/payments';
import './CartSidebar.css';

const CartSidebar = () => {
  const { items, removeItem, clearCart, isOpen, setIsOpen, totalPrice, totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setIsOpen(false);
      navigate('/login', { state: { from: '/cursos' } });
      return;
    }

    if (items.length === 0) return;

    // Open popup window BEFORE any async work (browsers block popups from async calls)
    const paymentWindow = window.open('about:blank', 'MercadoPago', 'width=800,height=600,scrollbars=yes');

    try {
      setLoading(true);
      const courseIds = items.map(item => item.id);
      const paymentData = await paymentsAPI.createCartPayment(courseIds);
      const paymentUrl = paymentData.init_point || paymentData.sandbox_init_point;

      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.location.href = paymentUrl;
      } else {
        // Popup blocked - fallback to same tab
        localStorage.setItem('pending_payment_preference_id', paymentData.preference_id);
        window.location.href = paymentUrl;
      }

      // Store preference_id for polling
      localStorage.setItem('pending_payment_preference_id', paymentData.preference_id);
      clearCart();
      setIsOpen(false);
    } catch (err) {
      if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
      console.error('Error al crear pago del carrito:', err);
      alert('Hubo un error al procesar el pago. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="cart-overlay"
        aria-label="Cerrar carrito"
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside className="cart-sidebar" role="dialog" aria-label="Carrito de compras">
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-left">
            <div className="cart-header-icon">
              <FiShoppingCart />
            </div>
            <div>
              <h2>Tu Carrito</h2>
              <p className="cart-header-count">
                {totalItems === 0 ? 'Sin cursos' : `${totalItems} curso${totalItems > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button className="cart-close-btn" onClick={() => setIsOpen(false)} aria-label="Cerrar carrito">
            <FiX />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="cart-empty">
            <FiBook className="cart-empty-icon" />
            <h3>Tu carrito está vacío</h3>
            <p>Explorá nuestros cursos de tejido y agregá los que más te gusten.</p>
            <button className="cart-empty-cta" onClick={() => { setIsOpen(false); navigate('/cursos'); }}>
              Ver Cursos
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="cart-item-image" />
                  ) : (
                    <div className="cart-item-placeholder">🧶</div>
                  )}
                  <div className="cart-item-info">
                    <h4 className="cart-item-title">{item.title}</h4>
                    {item.level && (
                      <p className="cart-item-meta">
                        {item.level === 'beginner' ? 'Inicial' : item.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                      </p>
                    )}
                    <p className="cart-item-price">{formatPrice(item.price)}</p>
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Quitar ${item.title} del carrito`}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="cart-footer">
              <div className="cart-total-row">
                <span className="cart-total-label">Total a pagar</span>
                <span className="cart-total-price">
                  {formatPrice(totalPrice)} <span>ARS</span>
                </span>
              </div>

              <button
                className="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={loading}
                id="cart-checkout-btn"
              >
                {loading ? (
                  <><div className="spinner-sm" /> Procesando...</>
                ) : (
                  <>Ir al Pago <FiArrowRight /></>
                )}
              </button>

              <button className="cart-clear-btn" onClick={clearCart}>
                <FiTrash2 /> Vaciar carrito
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
