import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { apiClient } from '../../lib/apiClient'

vi.mock('../../lib/apiClient', () => ({
  apiClient: { post: vi.fn() },
  attachAuthInterceptor: vi.fn(),
}))

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('stores the user and token on successful login', async () => {
    apiClient.post.mockResolvedValue({
      data: { user: { id: 1, name: 'Ada', email: 'ada@example.com' }, token: 'abc123' },
    })

    const store = useAuthStore()
    await store.login({ email: 'ada@example.com', password: 'password123' })

    expect(store.user.email).toBe('ada@example.com')
    expect(store.token).toBe('abc123')
    expect(store.isAuthenticated).toBe(true)
  })

  it('clears user and token on logout', async () => {
    apiClient.post.mockResolvedValue({ data: {} })

    const store = useAuthStore()
    store.user = { id: 1, name: 'Ada', email: 'ada@example.com' }
    store.token = 'abc123'

    await store.logout()

    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('clears the local session even when the logout request fails', async () => {
    apiClient.post.mockRejectedValue(new Error('Network Error'))

    const store = useAuthStore()
    store._setSession({ id: 1, name: 'Ada', email: 'ada@example.com' }, 'abc123')

    await expect(store.logout()).resolves.toBeUndefined()

    expect(apiClient.post).toHaveBeenCalledWith('/logout')
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(localStorage.getItem('sfm_token')).toBeNull()
  })

  it('clearSession drops the session without calling the API', () => {
    const store = useAuthStore()
    store._setSession({ id: 1, name: 'Ada', email: 'ada@example.com' }, 'abc123')

    store.clearSession()

    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('sfm_user')).toBeNull()
    expect(apiClient.post).not.toHaveBeenCalled()
  })
})
