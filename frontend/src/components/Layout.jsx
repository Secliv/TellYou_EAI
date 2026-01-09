import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import './Layout.css'

function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const handleLogout = () => {
    const username = user?.username
    logout()
    toast.info(`Sampai jumpa, ${username}! Anda telah logout.`)
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>🍰 TELLYOU EAI</h1>
          </div>
          <div className="nav-menu">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              📊 Dashboard
            </Link>
            
            {/* Admin Only: Full Inventory Management */}
            {isAdmin() ? (
              <Link to="/inventory" className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}>
                📦 Inventory
              </Link>
            ) : (
              <Link to="/catalog" className={`nav-link ${isActive('/catalog') ? 'active' : ''}`}>
                📦 Katalog Bahan
              </Link>
            )}
            
            <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
              🛒 {isAdmin() ? 'Kelola Pesanan' : 'Pesanan Saya'}
            </Link>
            
            {/* Payments - different label for admin/user */}
            <Link to="/payments" className={`nav-link ${isActive('/payments') ? 'active' : ''}`}>
              💳 {isAdmin() ? 'Kelola Pembayaran' : 'Pembayaran'}
            </Link>
            
            {/* Admin Only: User Management */}
            {isAdmin() && (
              <Link to="/users" className={`nav-link ${isActive('/users') ? 'active' : ''}`}>
                👥 Users
              </Link>
            )}
          </div>
          <div className="nav-user">
            <div className="user-info">
              <span className="user-name">{user?.username || 'User'}</span>
              <span className={`role-badge ${user?.role}`}>
                {user?.role === 'admin' ? '👑 Admin' : '🏪 User'}
              </span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
