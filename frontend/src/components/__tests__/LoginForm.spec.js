import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from '../LoginForm.vue'

describe('LoginForm', () => {
  it('renders a "Log In" header', () => {
    const wrapper = mount(LoginForm)

    expect(wrapper.find('h2').text()).toBe('Log In')
  })

  it('emits submit with the entered credentials', async () => {
    const wrapper = mount(LoginForm)

    await wrapper.find('[data-test="email"]').setValue('ada@example.com')
    await wrapper.find('[data-test="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      email: 'ada@example.com',
      password: 'password123',
    })
  })

  it('shows the given error message', () => {
    const wrapper = mount(LoginForm, { props: { error: 'Login failed.' } })

    expect(wrapper.find('[data-test="error"]').text()).toBe('Login failed.')
  })

  it('renders no error message by default', () => {
    const wrapper = mount(LoginForm)

    expect(wrapper.find('[data-test="error"]').exists()).toBe(false)
  })
})
