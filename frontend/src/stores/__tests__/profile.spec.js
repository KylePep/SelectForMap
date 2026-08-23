import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProfileStore } from '../profile'
import { apiClient } from '../../lib/apiClient'

vi.mock('../../lib/apiClient', () => ({ apiClient: { get: vi.fn(), patch: vi.fn() } }))

describe('profile store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches the profile and stores the home base', async () => {
    apiClient.get.mockResolvedValue({ data: { home_lat: 40.7128, home_lng: -74.006 } })

    const store = useProfileStore()
    await store.fetchProfile()

    expect(apiClient.get).toHaveBeenCalledWith('/profile')
    expect(store.homeLat).toBe(40.7128)
    expect(store.homeLng).toBe(-74.006)
    expect(store.hasHomeBase).toBe(true)
  })

  it('has no home base when the profile has none set', async () => {
    apiClient.get.mockResolvedValue({ data: { home_lat: null, home_lng: null } })

    const store = useProfileStore()
    await store.fetchProfile()

    expect(store.hasHomeBase).toBe(false)
  })

  it('treats a failed fetch as no home base instead of throwing', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'))

    const store = useProfileStore()
    await expect(store.fetchProfile()).resolves.toBeUndefined()

    expect(store.hasHomeBase).toBe(false)
  })

  it('sets the home location and updates state', async () => {
    apiClient.patch.mockResolvedValue({ data: { home_lat: 51.5, home_lng: -0.12 } })

    const store = useProfileStore()
    await store.setHomeLocation({ lat: 51.5, lng: -0.12 })

    expect(apiClient.patch).toHaveBeenCalledWith('/profile', { home_lat: 51.5, home_lng: -0.12 })
    expect(store.homeLat).toBe(51.5)
    expect(store.hasHomeBase).toBe(true)
  })

  it('propagates an error from setHomeLocation without changing state', async () => {
    apiClient.patch.mockRejectedValue(new Error('Network Error'))

    const store = useProfileStore()
    await expect(store.setHomeLocation({ lat: 51.5, lng: -0.12 })).rejects.toThrow('Network Error')

    expect(store.hasHomeBase).toBe(false)
  })
})
