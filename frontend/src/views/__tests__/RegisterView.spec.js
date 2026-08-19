import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RegisterView from '../RegisterView.vue'
import RegisterForm from '../../components/RegisterForm.vue'
import { apiClient } from '../../lib/apiClient'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

vi.mock('../../lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, apiClient: { post: vi.fn() } }
})

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('registers and redirects to the map on success', async () => {
    apiClient.post.mockResolvedValue({
      data: { user: { id: 1, name: 'Ada', email: 'ada@example.com' }, token: 'abc123' },
    })
    const wrapper = mount(RegisterView)

    wrapper.findComponent(RegisterForm).vm.$emit('submit', {
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    })
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/register', {
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    })
    expect(push).toHaveBeenCalledWith('/map')
  })

  it('surfaces a registration failure as an error on the form', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 422, data: { errors: { email: ['Email already taken.'] } } },
    })
    const wrapper = mount(RegisterView)

    wrapper.findComponent(RegisterForm).vm.$emit('submit', {
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    })
    await flushPromises()

    expect(wrapper.findComponent(RegisterForm).props('error')).toBe('Email already taken.')
    expect(push).not.toHaveBeenCalled()
  })
})
