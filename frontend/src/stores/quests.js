import { defineStore } from 'pinia'
import { apiClient } from '../lib/apiClient'

export const useQuestsStore = defineStore('quests', {
  state: () => ({
    quests: [],
    lastLoadedBounds: null,
  }),
  actions: {
    async fetchQuestsInBounds(bounds) {
      const { data } = await apiClient.get('/quests', { params: bounds })
      this.quests = data
      this.lastLoadedBounds = bounds
    },
  },
})
