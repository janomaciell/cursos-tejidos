import { useState, useEffect } from 'react';
import { paymentsAPI } from '../../api/payments';
import Loader from '../../components/common/Loader';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import './PurchaseHistory.css';

const PurchaseHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await paymentsAPI.getTransactions();
      setTransactions(data.results || data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheckCircle className="status-icon approved" />;
      case 'pending':
        return <FiClock className="status-icon pending" />;
      default:
        return <FiXCircle className="status-icon rejected" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      approved: 'Aprobado',
      pending: 'Pendiente',
      rejected: 'Rechazado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    return status === 'approved' ? 'success' : status === 'pending' ? 'warning' : 'error';
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="purchase-history-page">
      <div className="page-header">
        <h1>Historial de Compras</h1>
        <p>Revisa todas tus transacciones</p>
      </div>

      {transactions.length > 0 ? (
        <div className="transactions-container">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-course">
                  <h3>{transaction.course_title}</h3>
                  <span className="transaction-id">ID: {transaction.mp_payment_id}</span>
                </div>
                <div className={`transaction-status ${getStatusClass(transaction.status)}`}>
                  {getStatusIcon(transaction.status)}
                  <span>{getStatusText(transaction.status)}</span>
                </div>
              </div>

              <div className="transaction-details">
                <div className="detail-item">
                  <span className="detail-label">Fecha</span>
                  <span className="detail-value">{formatDate(transaction.created_at)}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Monto</span>
                  <span className="detail-value price">{formatPrice(transaction.amount)}</span>
                </div>

                {transaction.payment_method && (
                  <div className="detail-item">
                    <span className="detail-label">Método de Pago</span>
                    <span className="detail-value">{transaction.payment_method}</span>
                  </div>
                )}

                {transaction.approved_at && (
                  <div className="detail-item">
                    <span className="detail-label">Aprobado el</span>
                    <span className="detail-value">{formatDate(transaction.approved_at)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-history">
          <div className="empty-icon">
            <FiClock />
          </div>
          <h2>No hay transacciones</h2>
          <p>Aún no has realizado ninguna compra</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;