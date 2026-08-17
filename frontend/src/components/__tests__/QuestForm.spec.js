import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestForm from '../QuestForm.vue'

describe('QuestForm', () => {
  it('emits submit with the entered values plus the given coordinates', async () => {
    const wrapper = mount(QuestForm, { props: { lat: 40.7128, lng: -74.006 } })

    await wrapper.find('[data-test="title"]').setValue('Movie night')
    await wrapper.find('[data-test="category"]').setValue('movie')
    await wrapper.find('[data-test="starts_at"]').setValue('2026-09-01T18:00')
    await wrapper.find('[data-test="description"]').setValue('New sci-fi release')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      title: 'Movie night',
      description: 'New sci-fi release',
      category: 'movie',
      lat: 40.7128,
      lng: -74.006,
      starts_at: '2026-09-01T18:00',
    })
  })

  it('does not emit submit when the title is empty', async () => {
    const wrapper = mount(QuestForm, { props: { lat: 0, lng: 0 } })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
