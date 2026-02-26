import { useState, useEffect, useRef } from 'react';
import { paymentsAPI } from '../../api/payments';
import Loader from '../../components/common/Loader';
import { 
  FiCheckCircle, 
  FiClock, 
  FiXCircle, 
  FiFilter, 
  FiSearch,
  FiDownload,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiShoppingBag
} from 'react-icons/fi';
import gsap from 'gsap';
import './PurchaseHistory.css';

const PurchaseHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalAmount: 0
  });

  const pageRef = useRef(null);
  const statsRef = useRef([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    // Animaciones de entrada
    if (!loading && transactions.length > 0) {
      const tl = gsap.timeline({ delay: 0.2 });

      tl.fromTo('.page-header',
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      )
      .fromTo('.stats-grid',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo('.stat-card',
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(1.2)' },
        '-=0.3'
      )
      .fromTo('.filters-bar',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      )
      .fromTo('.transaction-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      );
    }
  }, [loading, transactions]);

  useEffect(() => {
    // Filtrar transacciones
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.mp_payment_id?.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    setFilteredTransactions(filtered);

    // Animar cambio
    if (transactions.length > 0) {
      gsap.fromTo('.transaction-card',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [searchTerm, statusFilter, transactions]);

  const loadTransactions = async () => {
    try {
      const data = await paymentsAPI.getTransactions();
      const transactionsList = data.results || data;
      setTransactions(transactionsList);
      setFilteredTransactions(transactionsList);
      
      // Calcular estadísticas
      const stats = {
        total: transactionsList.length,
        approved: transactionsList.filter(t => t.status === 'approved').length,
        pending: transactionsList.filter(t => t.status === 'pending').length,
        totalAmount: transactionsList
          .filter(t => t.status === 'approved')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      };
      setStats(stats);
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
        return <FiCheckCircle />;
      case 'pending':
        return <FiClock />;
      default:
        return <FiXCircle />;
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

  const handleDownloadReceipt = (transaction) => {
    // Placeholder para descargar comprobante
    console.log('Descargar comprobante:', transaction.id);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="purchase-history-page" ref={pageRef}>
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <FiShoppingBag />
          </div>
          <div className="header-text">
            <h1>Historial de Compras</h1>
            <p>Revisa todas tus transacciones y compras realizadas</p>
          </div>
        </div>
      </div>

      {transactions.length > 0 ? (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card" ref={el => statsRef.current[0] = el}>
              <div className="stat-icon total">
                <FiShoppingBag />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Compras</div>
              </div>
            </div>

            <div className="stat-card" ref={el => statsRef.current[1] = el}>
              <div className="stat-icon approved">
                <FiCheckCircle />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.approved}</div>
                <div className="stat-label">Aprobadas</div>
              </div>
            </div>

            <div className="stat-card" ref={el => statsRef.current[2] = el}>
              <div className="stat-icon pending">
                <FiClock />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pendientes</div>
              </div>
            </div>

            <div className="stat-card" ref={el => statsRef.current[3] = el}>
              <div className="stat-icon amount">
                <FiDollarSign />
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatPrice(stats.totalAmount)}</div>
                <div className="stat-label">Total Gastado</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Buscar por curso o ID de pago..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-buttons">
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Todas
              </button>
              <button
                className={`filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setStatusFilter('approved')}
              >
                <FiCheckCircle />
                Aprobadas
              </button>
              <button
                className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                <FiClock />
                Pendientes
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-count">
            Mostrando <strong>{filteredTransactions.length}</strong> de <strong>{transactions.length}</strong> transacciones
          </div>

          {/* Transactions List */}
          <div className="transactions-container">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-header">
                  <div className="transaction-course">
                    <h3>{transaction.course_title}</h3>
                    <span className="transaction-id">
                      <FiCreditCard />
                      ID: {transaction.mp_payment_id}
                    </span>
                  </div>
                  <div className="transaction-actions">
                    <div className={`transaction-status ${getStatusClass(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span>{getStatusText(transaction.status)}</span>
                    </div>
                    {transaction.status === 'approved' && (
                      <button
                        className="download-btn"
                        onClick={() => handleDownloadReceipt(transaction)}
                        title="Descargar comprobante"
                      >
                        <FiDownload />
                      </button>
                    )}
                  </div>
                </div>

                <div className="transaction-details">
                  <div className="detail-item">
                    <div className="detail-icon">
                      <FiCalendar />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Fecha de compra</span>
                      <span className="detail-value">{formatDate(transaction.created_at)}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon price">
                      <FiDollarSign />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Monto pagado</span>
                      <span className="detail-value price">{formatPrice(transaction.amount)}</span>
                    </div>
                  </div>

                  {transaction.payment_method && (
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FiCreditCard />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Método de pago</span>
                        <span className="detail-value">{transaction.payment_method}</span>
                      </div>
                    </div>
                  )}

                  {transaction.approved_at && (
                    <div className="detail-item">
                      <div className="detail-icon approved">
                        <FiCheckCircle />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Aprobado el</span>
                        <span className="detail-value">{formatDate(transaction.approved_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-history">
          <div className="empty-illustration">
            <div className="empty-icon">
              <FiShoppingBag />
            </div>
            <div className="empty-circle circle-1"></div>
            <div className="empty-circle circle-2"></div>
            <div className="empty-circle circle-3"></div>
          </div>
          <h2>No hay compras aún</h2>
          <p>Cuando realices una compra, aparecerá aquí tu historial completo</p>
          <a href="/cursos" className="browse-courses-btn">
            Explorar Cursos
          </a>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;