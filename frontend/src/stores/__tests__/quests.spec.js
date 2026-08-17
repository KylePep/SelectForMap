import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuestsStore } from '../quests'
import { apiClient } from '../../lib/apiClient'

vi.mock('../../lib/apiClient', () => ({ apiClient: { get: vi.fn() } }))

describe('quests store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches quests for the given bounds and stores them', async () => {
    apiClient.get.mockResolvedValue({ data: [{ id: 1, title: 'Movie night' }] })

    const store = useQuestsStore()
    const bounds = { min_lat: 40, max_lat: 41, min_lng: -75, max_lng: -74 }
    await store.fetchQuestsInBounds(bounds)

    expect(apiClient.get).toHaveBeenCalledWith('/quests', { params: bounds })
    expect(store.quests).toEqual([{ id: 1, title: 'Movie night' }])
    expect(store.lastLoadedBounds).toEqual(bounds)
  })
})
