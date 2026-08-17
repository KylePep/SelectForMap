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
      try {
        if (this.token) {
          await apiClient.post('/logout')
        }
      } catch {
        // Revoking the token server-side is best effort: if the request fails
        // (offline, already-expired token, server error) we must still drop the
        // local session rather than leaving a stale token in localStorage.
      } finally {
        this._setSession(null, null)
      }
    },
    /** Drops the local session without calling the API (e.g. after a 401). */
    clearSession() {
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
