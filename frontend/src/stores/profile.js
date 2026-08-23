import { defineStore } from 'pinia'
import { apiClient } from '../lib/apiClient'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    homeLat: null,
    homeLng: null,
  }),
  getters: {
    // Number.isFinite rejects null/undefined/NaN, guarding against a malformed
    // or unexpected API response quietly turning into a false "home base set".
    hasHomeBase: (state) => Number.isFinite(state.homeLat) && Number.isFinite(state.homeLng),
  },
  actions: {
    async fetchProfile() {
      try {
        const { data } = await apiClient.get('/profile')
        this.homeLat = data.home_lat
        this.homeLng = data.home_lng
      } catch {
        this.homeLat = null
        this.homeLng = null
      }
    },
    async setHomeLocation({ lat, lng }) {
      const { data } = await apiClient.patch('/profile', { home_lat: lat, home_lng: lng })
      this.homeLat = data.home_lat
      this.homeLng = data.home_lng
    },
  },
})
