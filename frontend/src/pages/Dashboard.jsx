import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import userService from '../services/userService'
import inventoryService from '../services/inventoryService'
import orderService from '../services/orderService'
import paymentService from '../services/paymentService'
import './Dashboard.css'

function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    inventoryItems: 0,
    inventoryValue: 0,
    lowStockItems: 0,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    totalPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    loading: true,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [userOrders, setUserOrders] = useState([])

  useEffect(() => {
    if (isAdmin()) {
      fetchAdminStats()
    } else {
      fetchUserStats()
    }
  }, [])

  const fetchAdminStats = async () => {
    try {
      const [usersResult, inventoryStats, ordersResult, paymentStats] = await Promise.allSettled([
        userService.getAllUsers(),
        inventoryService.getStats(),
        orderService.getAllOrders({}),
        paymentService.getStats()
      ])

      let lowStockResult = { value: { items: [] } }
      try {
        lowStockResult = { value: await inventoryService.getLowStock() }
      } catch (e) {
        console.log('Low stock fetch failed:', e)
      }

      const orders = ordersResult.status === 'fulfilled' ? (ordersResult.value.orders || []) : []

      setStats({
        totalUsers: usersResult.status === 'fulfilled' ? (usersResult.value.data?.length || 0) : 0,
        inventoryItems: inventoryStats.status === 'fulfilled' ? (inventoryStats.value.totalItems || 0) : 0,
        inventoryValue: inventoryStats.status === 'fulfilled' ? (inventoryStats.value.totalValue || 0) : 0,
        lowStockItems: inventoryStats.status === 'fulfilled' ? (inventoryStats.value.lowStockItems || 0) : 0,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
        processingOrders: orders.filter(o => o.status === 'processing').length,
        totalPayments: paymentStats.status === 'fulfilled' ? (paymentStats.value.totalPayments || 0) : 0,
        pendingPayments: paymentStats.status === 'fulfilled' ? (paymentStats.value.pendingPayments || 0) : 0,
        totalRevenue: paymentStats.status === 'fulfilled' ? (paymentStats.value.totalRevenue || 0) : 0,
        loading: false,
      })

      setRecentOrders(orders.slice(0, 5))

      if (lowStockResult.value && lowStockResult.value.items) {
        setLowStock(lowStockResult.value.items.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  const fetchUserStats = async () => {
    try {
      const [inventoryResult, ordersResult, paymentsResult] = await Promise.allSettled([
        inventoryService.getAll({}),
        orderService.getAllOrders({}),
        paymentService.getAll({})
      ])

      // Filter orders for current user
      let myOrders = []
      if (ordersResult.status === 'fulfilled' && ordersResult.value.orders) {
        myOrders = ordersResult.value.orders.filter(o => 
          o.customerId === user?.id || 
          o.customerName?.toLowerCase() === user?.username?.toLowerCase()
        )
      }

      // Filter payments for current user
      let myPayments = []
      if (paymentsResult.status === 'fulfilled' && paymentsResult.value.payments) {
        myPayments = paymentsResult.value.payments.filter(p => 
          p.customerId === user?.id || 
          p.customerName?.toLowerCase() === user?.username?.toLowerCase()
        )
      }

      setStats({
        inventoryItems: inventoryResult.status === 'fulfilled' ? (inventoryResult.value.items?.length || 0) : 0,
        totalOrders: myOrders.length,
        pendingOrders: myOrders.filter(o => o.status === 'pending').length,
        confirmedOrders: myOrders.filter(o => o.status === 'confirmed').length,
        deliveredOrders: myOrders.filter(o => o.status === 'delivered').length,
        totalPayments: myPayments.length,
        pendingPayments: myPayments.filter(p => p.status === 'pending').length,
        loading: false,
      })

      setUserOrders(myOrders)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      processing: '#9b59b6',
      shipped: '#1abc9c',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    }
    return colors[status] || '#666'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Menunggu',
      confirmed: 'Dikonfirmasi',
      processing: 'Diproses',
      shipped: 'Dikirim',
      delivered: 'Diterima',
      cancelled: 'Dibatalkan'
    }
    return labels[status] || status
  }

  return (
    <div className="dashboard">
      <h1>📊 Dashboard</h1>
      
      <div className="welcome-section">
        <h2>Selamat datang, {user?.username}!</h2>
        <p>Email: {user?.email}</p>
        <p>Role: <span className={`role-badge ${user?.role}`}>
          {user?.role === 'admin' ? '👑 Admin' : '🏪 User (Toko Kue)'}
        </span></p>
      </div>

      {/* Admin Dashboard */}
      {isAdmin() ? (
        <>
          <div className="stats-grid">
            <div className="stat-card users">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-value">{stats.loading ? '...' : stats.totalUsers}</p>
              </div>
            </div>
            
            <div className="stat-card inventory">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>Inventory Items</h3>
                <p className="stat-value">{stats.loading ? '...' : stats.inventoryItems}</p>
                {stats.lowStockItems > 0 && (
                  <span className="warning-badge">⚠️ {stats.lowStockItems} stok rendah</span>
                )}
              </div>
            </div>
            
            <div className="stat-card orders">
              <div className="stat-icon">🛒</div>
              <div className="stat-info">
                <h3>Total Orders</h3>
                <p className="stat-value">{stats.loading ? '...' : stats.totalOrders}</p>
                {stats.pendingOrders > 0 && (
                  <span className="pending-badge">{stats.pendingOrders} menunggu</span>
                )}
              </div>
            </div>
            
            <div className="stat-card payments">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>Total Revenue</h3>
                <p className="stat-value">{stats.loading ? '...' : formatPrice(stats.totalRevenue)}</p>
                {stats.pendingPayments > 0 && (
                  <span className="pending-badge">{stats.pendingPayments} pembayaran pending</span>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-content">
            {/* Recent Orders */}
            <div className="dashboard-section">
              <h3>📋 Pesanan Terbaru</h3>
              {recentOrders.length === 0 ? (
                <div className="empty-section">
                  <p className="empty-text">Belum ada pesanan</p>
                </div>
              ) : (
                <div className="recent-list">
                  {recentOrders.map(order => (
                    <div key={order.id} className="recent-item">
                      <div className="item-info">
                        <strong>#{order.id} - {order.customerName}</strong>
                        <span className="item-amount">{formatPrice(order.totalPrice)}</span>
                      </div>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/orders" className="view-all-link">Lihat Semua Pesanan →</Link>
            </div>

            {/* Low Stock Alert */}
            <div className="dashboard-section">
              <h3>⚠️ Stok Rendah</h3>
              {lowStock.length === 0 ? (
                <p className="empty-text">Semua stok aman</p>
              ) : (
                <div className="recent-list">
                  {lowStock.map(item => (
                    <div key={item.id} className="recent-item low-stock">
                      <div className="item-info">
                        <strong>{item.name}</strong>
                        <span className="stock-warning">
                          {item.quantity} / {item.minStock} {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/inventory" className="view-all-link">Kelola Inventory →</Link>
            </div>
          </div>

          {/* Admin Quick Actions */}
          <div className="dashboard-section quick-actions-section">
            <h3>🚀 Aksi Cepat</h3>
            <div className="quick-actions">
              <Link to="/orders" className="action-card">
                <span className="action-icon">📋</span>
                <span>Kelola Pesanan</span>
                {stats.pendingOrders > 0 && <span className="action-badge">{stats.pendingOrders}</span>}
              </Link>
              <Link to="/payments" className="action-card">
                <span className="action-icon">💳</span>
                <span>Konfirmasi Pembayaran</span>
                {stats.pendingPayments > 0 && <span className="action-badge">{stats.pendingPayments}</span>}
              </Link>
              <Link to="/inventory" className="action-card">
                <span className="action-icon">📦</span>
                <span>Update Stok</span>
              </Link>
              <Link to="/users" className="action-card">
                <span className="action-icon">👥</span>
                <span>Kelola Users</span>
              </Link>
            </div>
          </div>
        </>
      ) : (
        /* User Dashboard */
        <>
          <div className="stats-grid user-stats">
            <div className="stat-card orders">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>Total Pesanan</h3>
                <p className="stat-value">{stats.loading ? '...' : stats.totalOrders}</p>
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>Menunggu Konfirmasi</h3>
                <p className="stat-value">{stats.loading ? '...' : stats.pendingOrders}</p>
              </div>
            </div>

            <div className="stat-card confirmed">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>Perlu Dibayar</h3>
                <p className="stat-value">{stats.loading ? '...' : stats.confirmedOrders}</p>
              </div>
            </div>
            
            <div className="stat-card delivered">
              <div className="stat-icon">🎉</div>
              <div className="stat-info">
                <h3>Selesai</h3>
                <p className="stat-value">{stats.loading ? '...' : (stats.deliveredOrders || 0)}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-content">
            {/* User Orders List */}
            <div className="dashboard-section orders-section">
              <h3>📋 Daftar Pesanan Saya</h3>
              {userOrders.length === 0 ? (
                <div className="empty-section">
                  <p className="empty-text">Anda belum memiliki pesanan</p>
                  <Link to="/orders" className="btn-action">
                    🛒 Buat Pesanan Pertama
                  </Link>
                </div>
              ) : (
                <div className="orders-list">
                  {userOrders.map(order => (
                    <div key={order.id} className="order-item">
                      <div className="order-main">
                        <div className="order-id">
                          <strong>Order #{order.id}</strong>
                          <span className="order-date">
                            {order.createdAt && new Date(order.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <div className="order-items-preview">
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <span key={idx} className="item-tag">{item.name}</span>
                          ))}
                          {order.items?.length > 2 && (
                            <span className="more-items">+{order.items.length - 2} lainnya</span>
                          )}
                        </div>
                      </div>
                      <div className="order-meta">
                        <span 
                          className="status-badge" 
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                        <span className="order-total">{formatPrice(order.totalPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {userOrders.length > 0 && (
                <Link to="/orders" className="view-all-link">Lihat Semua Pesanan →</Link>
              )}
            </div>
          </div>

          {/* User Informasi Kontak - Di luar grid untuk posisi tengah */}
          <div class="dashboard-section contact-info-section">
            <h3>SweetCake</h3>

            <div class="contact-info-list">
              <span><strong>WhatsApp:</strong> 0812-3456-7890</span>
              <span><strong>Email:</strong> bebek@sweetcake.id</span>
            </div>

            <div class="contact-info-time">
              Senin – Minggu, 08:00 – 20:00 WIB
            </div>

            <div class="contact-info-footer">
              © 2025 SweetCake. All rights reserved.
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
