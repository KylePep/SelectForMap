import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterForm from '../RegisterForm.vue'

describe('RegisterForm', () => {
  it('renders a "Register" header', () => {
    const wrapper = mount(RegisterForm)

    expect(wrapper.find('h2').text()).toBe('Register')
  })

  it('emits submit with the entered details', async () => {
    const wrapper = mount(RegisterForm)

    await wrapper.find('[data-test="name"]').setValue('Ada Lovelace')
    await wrapper.find('[data-test="email"]').setValue('ada@example.com')
    await wrapper.find('[data-test="password"]').setValue('password123')
    await wrapper.find('[data-test="password_confirmation"]').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    })
  })

  it('shows the given error message', () => {
    const wrapper = mount(RegisterForm, { props: { error: 'Registration failed.' } })

    expect(wrapper.find('[data-test="error"]').text()).toBe('Registration failed.')
  })

  it('renders no error message by default', () => {
    const wrapper = mount(RegisterForm)

    expect(wrapper.find('[data-test="error"]').exists()).toBe(false)
  })
})
