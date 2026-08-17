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
    async createQuest(payload) {
      const { data } = await apiClient.post('/quests', payload)
      this.quests.push(data)
      return data
    },
    async updateQuest(id, payload) {
      const { data } = await apiClient.put(`/quests/${id}`, payload)
      const index = this.quests.findIndex((q) => q.id === id)
      if (index !== -1) this.quests[index] = data
      return data
    },
    async deleteQuest(id) {
      await apiClient.delete(`/quests/${id}`)
      this.quests = this.quests.filter((q) => q.id !== id)
    },
  },
})
