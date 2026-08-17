import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestPanel from '../QuestPanel.vue'

const quest = { id: 1, title: 'Movie night', description: 'Sci-fi', category: 'movie', lat: 1, lng: 2, starts_at: '2026-09-01T18:00:00Z' }

describe('QuestPanel', () => {
  it('emits delete with the quest id when delete is clicked', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="delete"]').trigger('click')

    expect(wrapper.emitted('delete')[0]).toEqual([1])
  })

  it('emits close when the close button is clicked', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="close"]').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
