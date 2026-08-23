import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PinTypePicker from '../PinTypePicker.vue'

describe('PinTypePicker', () => {
  it('emits select with "quest" when the Quest button is clicked', async () => {
    const wrapper = mount(PinTypePicker)

    await wrapper.find('[data-test="type-quest"]').trigger('click')

    expect(wrapper.emitted('select')[0]).toEqual(['quest'])
  })

  it('emits select with "recurring_quest" when the Recurring Quest button is clicked', async () => {
    const wrapper = mount(PinTypePicker)

    await wrapper.find('[data-test="type-recurring_quest"]').trigger('click')

    expect(wrapper.emitted('select')[0]).toEqual(['recurring_quest'])
  })

  it('emits select with "memory" when the Memory button is clicked', async () => {
    const wrapper = mount(PinTypePicker)

    await wrapper.find('[data-test="type-memory"]').trigger('click')

    expect(wrapper.emitted('select')[0]).toEqual(['memory'])
  })

  it('emits cancel when the cancel button is clicked', async () => {
    const wrapper = mount(PinTypePicker)

    await wrapper.find('[data-test="cancel"]').trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
