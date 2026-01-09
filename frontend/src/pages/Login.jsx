import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import authService from '../services/authService'
import './Auth.css'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    if (!formData.email || !formData.password) {
      setError('Email dan Password wajib diisi')
      toast.error('Email dan Password wajib diisi')
      return
    }

    setLoading(true)

    try {
      const response = await authService.login(formData.email, formData.password)
      
      if (response.data && response.data.success && response.data.data) {
        const userData = response.data.data.user
        login(response.data.data.token, userData)
        toast.success(`Login berhasil! Selamat datang, ${userData.username}`)
        navigate('/dashboard')
      } else {
        setError('Invalid response from server')
        toast.error('Login gagal. Response tidak valid.')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login gagal. Silakan coba lagi.'
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
          <h2>🍰 Login</h2>
          <p>Sistem Manajemen Bahan Kue</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
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
              placeholder="Masukkan password"
              minLength={6}
            />
            {!formData.password && <span className="field-hint">Password wajib diisi</span>}
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          Belum punya akun? <Link to="/register">Daftar disini</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
