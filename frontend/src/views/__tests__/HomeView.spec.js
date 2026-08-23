import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import HomeView from '../HomeView.vue'
import LoginForm from '../../components/LoginForm.vue'
import RegisterForm from '../../components/RegisterForm.vue'
import { apiClient } from '../../lib/apiClient'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

vi.mock('../../lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, apiClient: { post: vi.fn() } }
})

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('keeps the login and register forms hidden until their button is clicked', async () => {
    const wrapper = mount(HomeView)

    expect(wrapper.findComponent(LoginForm).exists()).toBe(false)
    expect(wrapper.findComponent(RegisterForm).exists()).toBe(false)

    await wrapper.get('button').trigger('click')
    expect(wrapper.findComponent(LoginForm).exists()).toBe(true)

    await wrapper.find('[data-test="modal-close"]').trigger('click')
    expect(wrapper.findComponent(LoginForm).exists()).toBe(false)

    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.findComponent(RegisterForm).exists()).toBe(true)
  })

  it('logs in and redirects to the map on success', async () => {
    apiClient.post.mockResolvedValue({
      data: { user: { id: 1, name: 'Ada', email: 'ada@example.com' }, token: 'abc123' },
    })
    const wrapper = mount(HomeView)
    await wrapper.findAll('button')[0].trigger('click')

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

  it('shows a login error without touching the register form', async () => {
    apiClient.post.mockRejectedValue({ response: { status: 401, data: {} } })
    const wrapper = mount(HomeView)
    await wrapper.findAll('button')[0].trigger('click')
    await wrapper.findAll('button')[1].trigger('click')

    wrapper.findComponent(LoginForm).vm.$emit('submit', {
      email: 'ada@example.com',
      password: 'wrong',
    })
    await flushPromises()

    expect(wrapper.findComponent(LoginForm).props('error')).toBe('Session expired, please log in again.')
    expect(wrapper.findComponent(RegisterForm).props('error')).toBe('')
    expect(push).not.toHaveBeenCalled()
  })

  it('registers and redirects to the map on success', async () => {
    apiClient.post.mockResolvedValue({
      data: { user: { id: 2, name: 'Ada', email: 'ada@example.com' }, token: 'abc123' },
    })
    const wrapper = mount(HomeView)
    await wrapper.findAll('button')[1].trigger('click')

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
})
