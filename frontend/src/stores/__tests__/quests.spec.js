import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuestsStore } from '../quests'
import { apiClient } from '../../lib/apiClient'

vi.mock('../../lib/apiClient', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))

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

  it('creates a quest and appends it to the list', async () => {
    apiClient.post = vi.fn().mockResolvedValue({ data: { id: 5, title: 'Movie night' } })

    const store = useQuestsStore()
    store.quests = [{ id: 1, title: 'Existing' }]
    await store.createQuest({ title: 'Movie night', category: 'movie', lat: 1, lng: 2, starts_at: '2026-01-01T00:00' })

    expect(apiClient.post).toHaveBeenCalledWith('/quests', {
      title: 'Movie night', category: 'movie', lat: 1, lng: 2, starts_at: '2026-01-01T00:00',
    })
    expect(store.quests).toHaveLength(2)
    expect(store.quests[1]).toEqual({ id: 5, title: 'Movie night' })
  })

  it('updates a quest in place', async () => {
    apiClient.put = vi.fn().mockResolvedValue({ data: { id: 1, title: 'Updated' } })

    const store = useQuestsStore()
    store.quests = [{ id: 1, title: 'Original' }]
    await store.updateQuest(1, { title: 'Updated' })

    expect(apiClient.put).toHaveBeenCalledWith('/quests/1', { title: 'Updated' })
    expect(store.quests[0].title).toBe('Updated')
  })

  it('removes a quest after deleting', async () => {
    apiClient.delete = vi.fn().mockResolvedValue({})

    const store = useQuestsStore()
    store.quests = [{ id: 1, title: 'Gone soon' }]
    await store.deleteQuest(1)

    expect(apiClient.delete).toHaveBeenCalledWith('/quests/1')
    expect(store.quests).toHaveLength(0)
  })
})
