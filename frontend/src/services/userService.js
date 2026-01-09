import api from './api'

const userService = {
  async getAllUsers() {
    const response = await api.get('/users')
    return response.data
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  async updateUser(id, data) {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },
}

export default userService
