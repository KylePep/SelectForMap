import { defineStore } from 'pinia'
import { apiClient } from '../lib/apiClient'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('sfm_user') || 'null'),
    token: localStorage.getItem('sfm_token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async register(payload) {
      const { data } = await apiClient.post('/register', payload)
      this._setSession(data.user, data.token)
    },
    async login(payload) {
      const { data } = await apiClient.post('/login', payload)
      this._setSession(data.user, data.token)
    },
    async logout() {
      if (this.token) {
        await apiClient.post('/logout')
      }
      this._setSession(null, null)
    },
    _setSession(user, token) {
      this.user = user
      this.token = token
      if (user && token) {
        localStorage.setItem('sfm_user', JSON.stringify(user))
        localStorage.setItem('sfm_token', token)
      } else {
        localStorage.removeItem('sfm_user')
        localStorage.removeItem('sfm_token')
      }
    },
  },
})
