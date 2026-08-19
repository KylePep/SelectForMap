import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import LoginView from '../LoginView.vue'
import LoginForm from '../../components/LoginForm.vue'
import { apiClient } from '../../lib/apiClient'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

vi.mock('../../lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, apiClient: { post: vi.fn() } }
})

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('logs in and redirects to the map on success', async () => {
    apiClient.post.mockResolvedValue({
      data: { user: { id: 1, name: 'Ada', email: 'ada@example.com' }, token: 'abc123' },
    })
    const wrapper = mount(LoginView)

    wrapper.findComponent(LoginForm).vm.$emit('submit', {
      email: 'ada@example.com',
      password: 'password123',
    })
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/login', {
      email: 'ada@example.com',
      password: 'password123',
    })
    expect(push).toHaveBeenCalledWith('/map')
  })

  it('surfaces a login failure as an error on the form', async () => {
    apiClient.post.mockRejectedValue({ response: { status: 422, data: { errors: { email: ['Invalid credentials.'] } } } })
    const wrapper = mount(LoginView)

    wrapper.findComponent(LoginForm).vm.$emit('submit', {
      email: 'ada@example.com',
      password: 'wrong',
    })
    await flushPromises()

    expect(wrapper.findComponent(LoginForm).props('error')).toBe('Invalid credentials.')
    expect(push).not.toHaveBeenCalled()
  })
})
