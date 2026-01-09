import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import paymentService from '../services/paymentService'
import transactionService from '../services/transactionService'
import orderService from '../services/orderService'
import './Payments.css'

function Payments() {
  const { isAdmin, user } = useAuth()
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [transactions, setTransactions] = useState([]) // Transactions from Toko Kue
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [stats, setStats] = useState({
    totalPayments: 0,
    confirmedPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingOrders, setPendingOrders] = useState([])
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('transfer')

  useEffect(() => {
    fetchPayments()
    if (isAdmin()) {
      fetchStats()
      fetchTransactions() // Fetch transactions from Toko Kue
    }
  }, [filterStatus])

  // Fetch pending orders after payments are loaded (for users)
  useEffect(() => {
    if (!isAdmin() && !loading) {
      fetchPendingOrders()
    }
  }, [payments, loading, user])

  // Refresh payments when modal is opened to ensure latest data
  useEffect(() => {
    if (showPaymentModal && !isAdmin()) {
      fetchPayments()
    }
  }, [showPaymentModal])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const filters = filterStatus ? { status: filterStatus } : {}
      const result = await paymentService.getAll(filters)
      if (result.success) {
        let paymentList = result.payments || []
        // For users, filter to only their payments
        if (!isAdmin() && user) {
          paymentList = paymentList.filter(p => 
            p.customerId === user.id || 
            p.customerName?.toLowerCase() === user.username?.toLowerCase()
          )
        }
        setPayments(paymentList)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Gagal memuat data pembayaran. Pastikan Payment Service berjalan.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await paymentService.getStats()
      if (result.success) {
        setStats(result)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const result = await transactionService.getAll()
      if (result.success) {
        setTransactions(result.transactions || [])
      }
    } catch (err) {
      console.error('Failed to fetch transactions from Stock-Payment Service:', err)
      // Don't show error to user, just log it
      setTransactions([])
    }
  }

  const fetchPendingOrders = async () => {
    try {
      // Get all orders for the user
      const result = await orderService.getAllOrders({})
      if (result.success) {
        // Filter orders that belong to current user
        const userOrders = (result.orders || []).filter(o => 
          o.customerId === user?.id || 
          o.customerName?.toLowerCase() === user?.username?.toLowerCase()
        )
        
        // Get ALL existing payment order IDs (any status) to exclude
        // This ensures we don't show orders that already have ANY payment
        // Convert to Set and normalize IDs to numbers for proper comparison
        const allPaymentOrderIds = new Set(
          payments.map(p => parseInt(p.orderId) || p.orderId)
        )
        
        // Filter to only show orders that need payment (pending or confirmed order status) 
        // and have NO payment at all (not even pending)
        const ordersNeedingPayment = userOrders.filter(o => {
          const orderId = parseInt(o.id) || o.id
          const orderStatus = o.status?.toLowerCase()
          
          // Only show orders with pending or confirmed status
          if (!['pending', 'confirmed'].includes(orderStatus)) {
            return false
          }
          
          // Exclude if order already has ANY payment
          if (allPaymentOrderIds.has(orderId)) {
            return false
          }
          
          return true
        })
        
        console.log('🔍 Pending Orders Filter:', {
          totalUserOrders: userOrders.length,
          paymentsCount: payments.length,
          paymentOrderIds: Array.from(allPaymentOrderIds),
          filteredOrders: ordersNeedingPayment.length,
          orderIds: ordersNeedingPayment.map(o => ({ id: o.id, status: o.status }))
        })
        
        setPendingOrders(ordersNeedingPayment)
      } else {
        // If fetch fails, set empty array
        setPendingOrders([])
      }
    } catch (err) {
      console.error('Failed to fetch pending orders:', err)
      // Set empty array on error to prevent showing stale data
      setPendingOrders([])
    }
  }

  const handleConfirmPayment = async (payment) => {
    try {
      const result = await paymentService.confirm(payment.id)
      if (result.success) {
        toast.success(`Pembayaran #${payment.id} berhasil dikonfirmasi!`)
        fetchPayments()
        fetchStats()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error('Gagal mengkonfirmasi pembayaran')
    }
  }

  const handleMakePayment = async (e) => {
    e.preventDefault()
    if (!selectedOrderForPayment) {
      toast.warning('Pilih pesanan terlebih dahulu')
      return
    }

    // Disable button to prevent double submission
    const submitButton = e.target.querySelector('button[type="submit"]')
    if (submitButton) {
      submitButton.disabled = true
      submitButton.textContent = 'Memproses...'
    }

    // Refresh payments data before submitting to get latest data
    await fetchPayments()
    
    // Re-check if payment already exists for this order (double validation)
    // Check ALL payments for this order, not just one
    const existingPayments = payments.filter(p => p.orderId === selectedOrderForPayment.id)
    if (existingPayments.length > 0) {
      const confirmedPayment = existingPayments.find(p => p.status === 'confirmed')
      if (confirmedPayment) {
        toast.error(`Pembayaran untuk Order #${selectedOrderForPayment.id} sudah dikonfirmasi. Tidak dapat membayar order yang sama.`)
        setShowPaymentModal(false)
        setSelectedOrderForPayment(null)
        fetchPendingOrders()
        if (submitButton) {
          submitButton.disabled = false
          submitButton.textContent = `Bayar ${formatPrice(selectedOrderForPayment.totalPrice)}`
        }
        return
      }
      
      const pendingPayment = existingPayments.find(p => p.status === 'pending')
      if (pendingPayment) {
        toast.error(`Pembayaran untuk Order #${selectedOrderForPayment.id} sudah ada dengan status "Menunggu Konfirmasi". Silakan tunggu konfirmasi admin.`)
        setShowPaymentModal(false)
        setSelectedOrderForPayment(null)
        fetchPendingOrders()
        if (submitButton) {
          submitButton.disabled = false
          submitButton.textContent = `Bayar ${formatPrice(selectedOrderForPayment.totalPrice)}`
        }
        return
      }
      
      // Any other payment status
      toast.error(`Pembayaran untuk Order #${selectedOrderForPayment.id} sudah ada. Tidak dapat membuat pembayaran baru.`)
      setShowPaymentModal(false)
      setSelectedOrderForPayment(null)
      fetchPendingOrders()
      if (submitButton) {
        submitButton.disabled = false
        submitButton.textContent = `Bayar ${formatPrice(selectedOrderForPayment.totalPrice)}`
      }
      return
    }

    try {
      const paymentData = {
        orderId: parseInt(selectedOrderForPayment.id),
        customerId: parseInt(user?.id) || 1,
        customerName: user?.username || 'Customer',
        amount: parseFloat(selectedOrderForPayment.totalPrice) || 0,
        paymentMethod: paymentMethod
      }
      
      console.log('Submitting payment:', paymentData) // Debug
      
      const result = await paymentService.create(paymentData)
      console.log('Payment result:', result) // Debug
      
      if (result && result.success) {
        toast.success('Pembayaran berhasil diajukan! Menunggu konfirmasi admin.')
        setShowPaymentModal(false)
        setSelectedOrderForPayment(null)
        // Refresh data to update UI - fetch payments first, then pending orders
        await fetchPayments()
        // Immediately fetch pending orders after payments are updated
        // The useEffect will also trigger when payments state changes
        await fetchPendingOrders()
      } else {
        toast.error(result?.message || 'Pembayaran gagal')
        if (submitButton) {
          submitButton.disabled = false
          submitButton.textContent = `Bayar ${formatPrice(selectedOrderForPayment.totalPrice)}`
        }
      }
    } catch (err) {
      console.error('Payment error:', err)
      const errorMessage = err.response?.data?.errors?.[0]?.message || 
                           err.response?.data?.message || 
                           err.message || 
                           'Gagal mengajukan pembayaran'
      toast.error(errorMessage)
      if (submitButton) {
        submitButton.disabled = false
        submitButton.textContent = `Bayar ${formatPrice(selectedOrderForPayment.totalPrice)}`
      }
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return '-'
    try {
      // Handle ISO string format
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString)
        return '-'
      }
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.warn('Error formatting date:', dateString, error)
      return '-'
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#27ae60',
      failed: '#e74c3c',
      refunded: '#9b59b6'
    }
    return colors[status] || '#666'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Menunggu Konfirmasi',
      confirmed: 'Dikonfirmasi',
      failed: 'Gagal',
      refunded: 'Dikembalikan'
    }
    return labels[status] || status
  }

  return (
    <div className="payments">
      <div className="payments-header">
        <h1>{isAdmin() ? '💰 Manajemen Pembayaran' : '💳 Pembayaran Saya'}</h1>
        {!isAdmin() && pendingOrders.length > 0 && (
          <button className="btn-primary" onClick={async () => {
            // Refresh payments data before opening modal
            await fetchPayments()
            // Check if there are still orders without payment
            if (pendingOrders.length > 0) {
              const firstOrder = pendingOrders[0]
              const existingPayment = payments.find(p => p.orderId === firstOrder.id)
              if (existingPayment) {
                toast.error(`Pembayaran untuk Order #${firstOrder.id} sudah ada. Silakan refresh halaman.`)
                fetchPendingOrders()
                return
              }
              setSelectedOrderForPayment(firstOrder)
            }
            setShowPaymentModal(true)
          }}>
            + Bayar Pesanan
          </button>
        )}
      </div>

      {/* Stats - Admin Only */}
      {isAdmin() && (
        <div className="payment-stats">
          <div className="stat-card">
            <h3>Total Transaksi</h3>
            <p>{stats.totalPayments + transactions.length}</p>
            <small style={{fontSize: '0.8rem', color: '#666'}}>
              Internal: {stats.totalPayments} | External: {transactions.length}
            </small>
          </div>
          <div className="stat-card confirmed">
            <h3>Confirmed</h3>
            <p>{stats.confirmedPayments + transactions.filter(t => t.payment_status === 'SUCCESS').length}</p>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <p>{stats.pendingPayments + transactions.filter(t => t.payment_status === 'PENDING').length}</p>
          </div>
          <div className="stat-card revenue">
            <h3>Total Revenue</h3>
            <p>{formatPrice(stats.totalRevenue + transactions.reduce((sum, t) => sum + (t.total_cost || 0), 0))}</p>
          </div>
        </div>
      )}

      {/* User Payment Info */}
      {!isAdmin() && (
        <>
          {/* Payment Flow Info */}
          <div className="payment-flow-info">
            <div className="flow-step">
              <span className="step-num">1</span>
              <span>Buat Pesanan</span>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <span className="step-num">2</span>
              <span>Admin Konfirmasi</span>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step active">
              <span className="step-num">3</span>
              <span>Bayar</span>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <span className="step-num">4</span>
              <span>Selesai</span>
            </div>
          </div>

          <div className="user-payment-info">
            <div className="info-card needs-payment">
              <span className="icon">💳</span>
              <div className="info-content">
                <h3>Perlu Dibayar</h3>
                <p className="count">{pendingOrders.length}</p>
                {pendingOrders.length === 0 && (
                  <small className="no-orders-hint">Belum ada pesanan yang perlu dibayar</small>
                )}
              </div>
              {pendingOrders.length > 0 && (
                <button className="btn-pay-now" onClick={async () => {
                  // Refresh payments data before opening modal to ensure latest data
                  await fetchPayments()
                  // Auto-select first order when opening modal
                  if (pendingOrders.length > 0) {
                    const firstOrder = pendingOrders[0]
                    // Double check if order already has payment
                    const existingPayment = payments.find(p => p.orderId === firstOrder.id)
                    if (existingPayment) {
                      toast.error(`Pembayaran untuk Order #${firstOrder.id} sudah ada. Silakan refresh halaman.`)
                      fetchPendingOrders()
                      return
                    }
                    setSelectedOrderForPayment(firstOrder)
                  }
                  setShowPaymentModal(true)
                }}>
                  Bayar Sekarang
                </button>
              )}
            </div>
            <div className="info-card">
              <span className="icon">⏳</span>
              <div className="info-content">
                <h3>Menunggu Konfirmasi Admin</h3>
                <p className="count">{payments.filter(p => p.status === 'pending').length}</p>
              </div>
            </div>
            <div className="info-card success">
              <span className="icon">✅</span>
              <div className="info-content">
                <h3>Pembayaran Dikonfirmasi</h3>
                <p className="count">{payments.filter(p => p.status === 'confirmed').length}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Filter */}
      <div className="filters">
        <label>Filter Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Memuat data pembayaran...</div>
      ) : (
        <div className="payments-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Order ID</th>
                {isAdmin() && <th>Customer</th>}
                <th>Jumlah</th>
                <th>Metode</th>
                <th>Status</th>
                <th>Tanggal</th>
                {isAdmin() && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && transactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin() ? 8 : 6} className="empty">
                    {isAdmin() ? 'Tidak ada data pembayaran' : 'Anda belum memiliki riwayat pembayaran'}
                  </td>
                </tr>
              ) : (
                <>
                  {/* Internal Payments (from Payment Service) */}
                  {payments.map(payment => (
                    <tr key={`payment-${payment.id}`}>
                      <td>#{payment.id}</td>
                      <td>Order #{payment.orderId}</td>
                      {isAdmin() && <td>{payment.customerName || `Customer #${payment.customerId}`}</td>}
                      <td className="amount">{formatPrice(payment.amount)}</td>
                      <td className="method">
                        {payment.paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer' : 
                         payment.paymentMethod === 'ewallet' ? '📱 E-Wallet' : 
                         payment.paymentMethod === 'cash' ? '💵 Cash' : payment.paymentMethod}
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(payment.status) }}
                        >
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td>
                        {payment.status === 'confirmed' && payment.paymentDate 
                          ? formatDate(payment.paymentDate) 
                          : formatDate(payment.createdAt)}
                      </td>
                      {isAdmin() && (
                        <td>
                          {payment.status === 'pending' && (
                            <button 
                              className="btn-confirm"
                              onClick={() => handleConfirmPayment(payment)}
                            >
                              ✓ Konfirmasi
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {/* External Transactions (from Stock-Payment Service - Toko Kue) */}
                  {isAdmin() && transactions.map(transaction => (
                    <tr key={`transaction-${transaction.transaction_id}`} style={{backgroundColor: '#f8f9fa'}}>
                      <td>
                        <span style={{fontSize: '0.85rem', color: '#666'}}>
                          {transaction.transaction_id}
                        </span>
                      </td>
                      <td>
                        Order #{transaction.order_id || 'N/A'}
                        {transaction.external_order_id && (
                          <small style={{display: 'block', fontSize: '0.75rem', color: '#999'}}>
                            Ext: {transaction.external_order_id}
                          </small>
                        )}
                      </td>
                      <td>
                        <span style={{fontSize: '0.9rem'}}>
                          {transaction.source_system === 'TOKO_KUE_GATEWAY' ? '🍰 Toko Kue' : transaction.source_system || 'External'}
                        </span>
                      </td>
                      <td className="amount">{formatPrice(transaction.total_cost || 0)}</td>
                      <td className="method">
                        {transaction.payment_method || '-'}
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: transaction.payment_status === 'SUCCESS' ? '#27ae60' :
                                           transaction.payment_status === 'PENDING' ? '#f39c12' :
                                           transaction.payment_status === 'FAILED' ? '#e74c3c' : '#666'
                          }}
                        >
                          {transaction.payment_status === 'SUCCESS' ? 'Dikonfirmasi' :
                           transaction.payment_status === 'PENDING' ? 'Menunggu' :
                           transaction.payment_status === 'FAILED' ? 'Gagal' : transaction.payment_status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        {formatDate(transaction.payment_completed_at || transaction.created_at)}
                      </td>
                      <td>
                        <small style={{fontSize: '0.75rem', color: '#999'}}>
                          {transaction.source_system === 'TOKO_KUE_GATEWAY' ? 'Toko Kue' : 'External'}
                        </small>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal - User Only */}
      {showPaymentModal && !isAdmin() && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>💳 Bayar Pesanan</h2>
            
            <form onSubmit={handleMakePayment}>
              <div className="form-group">
                <label>Pilih Pesanan {pendingOrders.length > 1 && <small>(klik untuk memilih)</small>}</label>
                <div className="order-select-list">
                  {pendingOrders.length === 0 ? (
                    <p className="no-orders-text">Tidak ada pesanan yang perlu dibayar</p>
                  ) : (
                    pendingOrders.map(order => {
                      // Check if order already has payment
                      const hasPayment = payments.find(p => p.orderId === order.id)
                      
                      return (
                      <div 
                        key={order.id} 
                        className={`order-select-card ${selectedOrderForPayment?.id === order.id ? 'selected' : ''} ${hasPayment ? 'disabled' : ''}`}
                        onClick={() => {
                          if (hasPayment) {
                            toast.error(`Order #${order.id} sudah memiliki pembayaran. Silakan refresh halaman.`)
                            fetchPendingOrders()
                            return
                          }
                          setSelectedOrderForPayment(order)
                        }}
                      >
                        <div className="order-select-check">
                          {selectedOrderForPayment?.id === order.id ? '✓' : '○'}
                        </div>
                        <div className="order-info">
                          <strong>Order #{order.id}</strong>
                          <span className="order-items-count">{order.items?.length || 0} items</span>
                          {hasPayment && <span style={{color: '#e74c3c', fontSize: '0.8rem', display: 'block', marginTop: '0.2rem'}}>⚠️ Sudah memiliki pembayaran</span>}
                        </div>
                        <div className="order-total">
                          {formatPrice(order.totalPrice)}
                        </div>
                      </div>
                      )
                    })
                  )}
                </div>
              </div>

              {selectedOrderForPayment && (
                <>
                  <div className="selected-order-detail">
                    <h4>Detail Pesanan #{selectedOrderForPayment.id}</h4>
                    <ul>
                      {selectedOrderForPayment.items?.map((item, idx) => (
                        <li key={idx}>
                          {item.name} - {item.quantity} {item.unit} × {formatPrice(item.price)}
                        </li>
                      ))}
                    </ul>
                    <div className="total-amount">
                      Total: <strong>{formatPrice(selectedOrderForPayment.totalPrice)}</strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Metode Pembayaran</label>
                    <div className="payment-methods">
                      <label className={`payment-method ${paymentMethod === 'transfer' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="transfer"
                          checked={paymentMethod === 'transfer'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span className="method-icon">🏦</span>
                        <span>Bank Transfer</span>
                      </label>
                      <label className={`payment-method ${paymentMethod === 'e_wallet' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="e_wallet"
                          checked={paymentMethod === 'e_wallet'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span className="method-icon">📱</span>
                        <span>E-Wallet</span>
                      </label>
                      <label className={`payment-method ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="cash"
                          checked={paymentMethod === 'cash'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span className="method-icon">💵</span>
                        <span>Cash</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={!selectedOrderForPayment || payments.find(p => p.orderId === selectedOrderForPayment?.id)}
                >
                  {payments.find(p => p.orderId === selectedOrderForPayment?.id) 
                    ? 'Pembayaran Sudah Ada' 
                    : `Bayar ${selectedOrderForPayment && formatPrice(selectedOrderForPayment.totalPrice)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
