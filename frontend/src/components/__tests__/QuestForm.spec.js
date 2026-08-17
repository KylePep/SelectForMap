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

  it('starts blank with a "Create quest" label when no quest is given', () => {
    const wrapper = mount(QuestForm, { props: { lat: 1, lng: 2 } })

    expect(wrapper.find('[data-test="title"]').element.value).toBe('')
    expect(wrapper.find('[data-test="category"]').element.value).toBe('food')
    expect(wrapper.find('[data-test="submit"]').text()).toBe('Create quest')
  })

  describe('when reused as an edit form', () => {
    const quest = {
      id: 7,
      title: 'Movie night',
      description: 'Sci-fi',
      category: 'movie',
      lat: 40.7128,
      lng: -74.006,
      starts_at: '2026-09-01T18:00:00+00:00',
    }

    it('pre-fills the fields from the quest and labels the submit button "Save quest"', () => {
      const wrapper = mount(QuestForm, { props: { quest } })

      expect(wrapper.find('[data-test="title"]').element.value).toBe('Movie night')
      expect(wrapper.find('[data-test="description"]').element.value).toBe('Sci-fi')
      expect(wrapper.find('[data-test="category"]').element.value).toBe('movie')
      // The ISO-8601 value is narrowed to what <input type="datetime-local"> accepts.
      expect(wrapper.find('[data-test="starts_at"]').element.value).toBe('2026-09-01T18:00')
      expect(wrapper.find('[data-test="submit"]').text()).toBe('Save quest')
    })

    it('emits submit with the edited values and the quest own coordinates', async () => {
      const wrapper = mount(QuestForm, { props: { quest } })

      await wrapper.find('[data-test="title"]').setValue('Movie night (rescheduled)')
      await wrapper.find('[data-test="starts_at"]').setValue('2026-09-02T20:30')
      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.emitted('submit')[0][0]).toEqual({
        title: 'Movie night (rescheduled)',
        description: 'Sci-fi',
        category: 'movie',
        lat: 40.7128,
        lng: -74.006,
        starts_at: '2026-09-02T20:30',
      })
    })

    it('still refuses to submit an emptied title', async () => {
      const wrapper = mount(QuestForm, { props: { quest } })

      await wrapper.find('[data-test="title"]').setValue('   ')
      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('handles a space-separated timestamp and a null description', () => {
      const wrapper = mount(QuestForm, {
        props: { quest: { ...quest, description: null, starts_at: '2026-09-01 18:00:00' } },
      })

      expect(wrapper.find('[data-test="description"]').element.value).toBe('')
      expect(wrapper.find('[data-test="starts_at"]').element.value).toBe('2026-09-01T18:00')
    })
  })
})
