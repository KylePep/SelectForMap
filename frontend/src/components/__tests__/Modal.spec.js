import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../Modal.vue'

function mountModal(props = {}) {
  return mount(Modal, {
    props: { modelValue: true, ...props },
    slots: { default: '<div data-test="slot-content">Form goes here</div>' },
  })
}

describe('Modal', () => {
  it('does not render when modelValue is false', () => {
    const wrapper = mountModal({ modelValue: false })

    expect(wrapper.find('[data-test="modal-backdrop"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="slot-content"]').exists()).toBe(false)
  })

  it('renders the slot content when modelValue is true', () => {
    const wrapper = mountModal()

    expect(wrapper.find('[data-test="slot-content"]').text()).toBe('Form goes here')
  })

  it('renders a title when given one', () => {
    const wrapper = mountModal({ title: 'Log In' })

    expect(wrapper.find('h2').text()).toBe('Log In')
  })

  it('renders no title by default', () => {
    const wrapper = mountModal()

    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('emits update:modelValue(false) when the backdrop is clicked', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="modal-backdrop"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('does not close when clicking inside the content', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="slot-content"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits update:modelValue(false) when the close button is clicked', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="modal-close"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('emits update:modelValue(false) on Escape while open', async () => {
    const wrapper = mountModal()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('does not react to Escape once closed', async () => {
    const wrapper = mountModal({ modelValue: false })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
