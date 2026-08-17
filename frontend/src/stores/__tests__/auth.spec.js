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
})
