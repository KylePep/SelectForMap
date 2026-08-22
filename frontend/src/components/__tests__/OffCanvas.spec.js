import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OffCanvas from '../OffCanvas.vue'

function mountOffCanvas(props = {}) {
  return mount(OffCanvas, {
    props: { modelValue: true, ...props },
    slots: { default: '<div data-test="slot-content">Menu goes here</div>' },
  })
}

describe('OffCanvas', () => {
  it('does not render when modelValue is false', () => {
    const wrapper = mountOffCanvas({ modelValue: false })

    expect(wrapper.find('[data-test="offcanvas-backdrop"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="slot-content"]').exists()).toBe(false)
  })

  it('renders the slot content when modelValue is true', () => {
    const wrapper = mountOffCanvas()

    expect(wrapper.find('[data-test="slot-content"]').text()).toBe('Menu goes here')
  })

  it('renders a title when given one', () => {
    const wrapper = mountOffCanvas({ title: 'Menu' })

    expect(wrapper.find('h2').text()).toBe('Menu')
  })

  it('renders no title by default', () => {
    const wrapper = mountOffCanvas()

    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('emits update:modelValue(false) when the backdrop is clicked', async () => {
    const wrapper = mountOffCanvas()

    await wrapper.find('[data-test="offcanvas-backdrop"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('does not close when clicking inside the panel', async () => {
    const wrapper = mountOffCanvas()

    await wrapper.find('[data-test="slot-content"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits update:modelValue(false) when the close button is clicked', async () => {
    const wrapper = mountOffCanvas()

    await wrapper.find('[data-test="offcanvas-close"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('emits update:modelValue(false) on Escape while open', async () => {
    const wrapper = mountOffCanvas()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('does not react to Escape once closed', async () => {
    const wrapper = mountOffCanvas({ modelValue: false })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
