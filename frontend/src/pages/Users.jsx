import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Navigate } from 'react-router-dom'
import userService from '../services/userService'
import './Users.css'

function Users() {
  const { isAdmin, user: currentUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user'
  })

  // Redirect if not admin
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const result = await userService.getAllUsers()
      if (result.success !== false) {
        setUsers(result.data || [])
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await userService.updateUser(editUser.id, formData)
      if (result.success !== false) {
        toast.success(`Pengguna "${formData.username}" berhasil diupdate!`)
        setShowModal(false)
        setEditUser(null)
        fetchUsers()
      } else {
        toast.error(result.message || 'Gagal mengupdate pengguna')
      }
    } catch (err) {
      toast.error('Gagal mengupdate pengguna')
    }
  }

  const handleDelete = async (user) => {
    // Prevent deleting yourself
    if (user.id === currentUser?.id) {
      toast.warning('Anda tidak dapat menghapus akun sendiri!')
      return
    }

    if (confirm(`Yakin ingin menghapus pengguna "${user.username}"?`)) {
      try {
        const result = await userService.deleteUser(user.id)
        if (result.success !== false) {
          toast.success(`Pengguna "${user.username}" berhasil dihapus!`)
          fetchUsers()
        } else {
          toast.error(result.message || 'Gagal menghapus pengguna')
        }
      } catch (err) {
        toast.error('Gagal menghapus pengguna')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return '-'
    }
  }

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'role-admin' : 'role-user'
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>👥 Manajemen Pengguna</h1>
        <div className="users-count">
          <span className="count">{users.length}</span> pengguna terdaftar
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stats */}
      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{users.length}</p>
          </div>
        </div>
        <div className="stat-card admin">
          <div className="stat-icon">👑</div>
          <div className="stat-info">
            <h3>Admins</h3>
            <p>{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>
        <div className="stat-card user">
          <div className="stat-icon">🏪</div>
          <div className="stat-info">
            <h3>Users</h3>
            <p>{users.filter(u => u.role === 'user').length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Memuat data pengguna...</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty">Tidak ada pengguna</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td className="username">
                      <strong>{user.username}</strong>
                      {user.id === currentUser?.id && <span className="you-badge">(Anda)</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role === 'admin' ? '👑 Admin' : '🏪 User'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="actions">
                      <button className="btn-edit" onClick={() => handleEdit(user)}>
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? 'Tidak dapat menghapus akun sendiri' : ''}
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ Edit Pengguna</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">🏪 User</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
