import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestPanel from '../QuestPanel.vue'

const quest = {
  id: 1,
  title: 'Movie night',
  description: 'Sci-fi',
  category: 'movie',
  type: 'quest',
  lat: 1,
  lng: 2,
  starts_at: '2026-09-01T18:00:00Z',
}

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

  it('shows the quest details including the scheduled time for a quest', () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    expect(wrapper.text()).toContain('Movie night')
    expect(wrapper.text()).toContain(quest.starts_at)
  })

  it('emits edit with the quest when Edit is clicked', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="edit"]').trigger('click')

    expect(wrapper.emitted('edit')[0]).toEqual([quest])
  })

  it('shows a Complete button for a quest', () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    expect(wrapper.find('[data-test="complete"]').exists()).toBe(true)
  })

  it('does not show a Complete button or the scheduled time for a recurring quest', () => {
    const wrapper = mount(QuestPanel, {
      props: { quest: { ...quest, type: 'recurring_quest', starts_at: null } },
    })

    expect(wrapper.find('[data-test="complete"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('2026-09-01T18:00:00Z')
  })

  it('does not show a Complete button for a memory', () => {
    const wrapper = mount(QuestPanel, {
      props: { quest: { ...quest, type: 'memory', starts_at: null } },
    })

    expect(wrapper.find('[data-test="complete"]').exists()).toBe(false)
  })

  describe('completing a quest', () => {
    it('shows erase/recurring/memory choices when Complete is clicked', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')

      expect(wrapper.find('[data-test="complete-erase"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="complete-recurring"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="complete-memory"]').exists()).toBe(true)
    })

    it('emits delete when Erase is chosen', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')
      await wrapper.find('[data-test="complete-erase"]').trigger('click')

      expect(wrapper.emitted('delete')[0]).toEqual([1])
    })

    it('emits save with a recurring_quest conversion payload when "Keep as Recurring Quest" is chosen', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')
      await wrapper.find('[data-test="complete-recurring"]').trigger('click')

      const [id, payload] = wrapper.emitted('save')[0]
      expect(id).toBe(1)
      expect(payload).toMatchObject({
        title: 'Movie night',
        category: 'movie',
        type: 'recurring_quest',
        starts_at: null,
      })
      expect(payload.completed_at).toBeTruthy()
    })

    it('emits save with a memory conversion payload when "Keep as Memory" is chosen', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')
      await wrapper.find('[data-test="complete-memory"]').trigger('click')

      const [id, payload] = wrapper.emitted('save')[0]
      expect(id).toBe(1)
      expect(payload).toMatchObject({ type: 'memory', starts_at: null })
      expect(payload.completed_at).toBeTruthy()
    })

    it('returns to the details view when the complete choices are cancelled', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')
      await wrapper.find('[data-test="complete-cancel"]').trigger('click')

      expect(wrapper.find('[data-test="complete-erase"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="edit"]').exists()).toBe(true)
    })
  })
})
