import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';
import { usePayment } from '../../hooks/usePayment';
import Loader from '../../components/common/Loader';
import './PaymentResult.css';

/**
 * Página a la que Mercado Pago redirige después del pago (back_urls).
 * Llama a checkPendingPayment() para sincronizar con el backend y luego redirige.
 * Sin esta ruta, el usuario caía en 404 y el pago no se reflejaba en la web.
 */
const PaymentResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkPendingPayment } = usePayment();
  const [status, setStatus] = useState('checking'); // checking | success | failure | pending

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const payment = await checkPendingPayment();

      if (cancelled) return;

      if (payment) {
        if (payment.status === 'approved') {
          setStatus('success');
          setTimeout(() => navigate('/mis-cursos', { replace: true }), 2500);
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          setStatus('failure');
          setTimeout(() => navigate('/mis-cursos', { replace: true }), 4000);
        } else {
          setStatus('pending');
          setTimeout(() => navigate('/mis-cursos', { replace: true }), 3000);
        }
      } else {
        // Sin preference_id en localStorage (ej. llegó directo por URL)
        const path = location.pathname;
        if (path.includes('failure')) {
          setStatus('failure');
        } else if (path.includes('pending')) {
          setStatus('pending');
        } else {
          setStatus('success');
        }
        setTimeout(() => navigate('/mis-cursos', { replace: true }), 3000);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [checkPendingPayment, navigate, location.pathname]);

  if (status === 'checking') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-box">
          <div className="loader-wrapper">
            <Loader />
          </div>
          <p>Verificando el pago con Mercado Pago...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-box success">
          <div className="payment-result-icon"><FiCheck /></div>
          <h1>¡Pago acreditado!</h1>
          <p>Ya podés entrar al curso desde Mis Cursos.</p>
          <p className="payment-result-redirect">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  if (status === 'failure') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-box failure">
          <div className="payment-result-icon"><FiX /></div>
          <h1>El pago no se completó</h1>
          <p>Si se debió dinero, puede tardar unos minutos. Revisá en Mis Cursos o en el historial.</p>
          <p className="payment-result-redirect">Redirigiendo a Mis Cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className="payment-result-box pending">
        <div className="payment-result-icon"><FiClock /></div>
        <h1>Pago pendiente</h1>
        <p>Cuando se acredite, el curso aparecerá en Mis Cursos.</p>
        <p className="payment-result-redirect">Redirigiendo...</p>
      </div>
    </div>
  );
};

export default PaymentResult;
