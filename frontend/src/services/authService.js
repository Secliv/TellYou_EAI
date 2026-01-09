import api from './api'

const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    return response
  },
}

export default authService


