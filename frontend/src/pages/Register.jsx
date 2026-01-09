import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import authService from '../services/authService'
import './Auth.css'

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validasi semua field wajib
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.role) {
      setError('Semua field wajib diisi')
      toast.error('Semua field wajib diisi')
      return
    }

    if (formData.username.length < 3) {
      setError('Username minimal 3 karakter')
      toast.error('Username minimal 3 karakter')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      toast.error('Password tidak cocok')
      return
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      toast.error('Password minimal 6 karakter')
      return
    }

    setLoading(true)

    try {
      const response = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })
      
      if (response.data && response.data.success && response.data.data) {
        const userData = response.data.data.user
        login(response.data.data.token, userData)
        toast.success(`Registrasi berhasil! Selamat datang, ${userData.username}`)
        navigate('/dashboard')
      } else {
        setError('Response tidak valid dari server')
        toast.error('Registrasi gagal')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registrasi gagal. Silakan coba lagi.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🍰 Daftar Akun</h2>
          <p>Sistem Manajemen Bahan Kue</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username <span className="required">*</span></label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Masukkan username"
              minLength={3}
            />
            {!formData.username && <span className="field-hint">Username wajib diisi (min. 3 karakter)</span>}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Masukkan email"
            />
            {!formData.email && <span className="field-hint">Email wajib diisi</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password <span className="required">*</span></label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Masukkan password (min. 6 karakter)"
              minLength={6}
            />
            {!formData.password && <span className="field-hint">Password wajib diisi (min. 6 karakter)</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Konfirmasi Password <span className="required">*</span></label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Ulangi password"
            />
            {!formData.confirmPassword && <span className="field-hint">Konfirmasi password wajib diisi</span>}
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <span className="field-error">Password tidak cocok</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="role">Role <span className="required">*</span></label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">-- Pilih Role --</option>
              <option value="user">🏪 User (Toko Kue)</option>
              <option value="admin">👑 Admin</option>
            </select>
            {!formData.role && <span className="field-hint">Role wajib dipilih</span>}
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p className="auth-link">
          Sudah punya akun? <Link to="/login">Login disini</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
