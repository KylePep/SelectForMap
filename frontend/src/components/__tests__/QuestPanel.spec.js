import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestPanel from '../QuestPanel.vue'
import QuestForm from '../QuestForm.vue'

const quest = {
  id: 1,
  title: 'Movie night',
  description: 'Sci-fi',
  category: 'movie',
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

  it('shows the quest details and no edit form by default', () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    expect(wrapper.text()).toContain('Movie night')
    expect(wrapper.findComponent(QuestForm).exists()).toBe(false)
  })

  it('reveals a pre-filled edit form when Edit is clicked', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="edit"]').trigger('click')

    const form = wrapper.findComponent(QuestForm)
    expect(form.exists()).toBe(true)
    expect(form.props('quest')).toEqual(quest)
    expect(form.find('[data-test="title"]').element.value).toBe('Movie night')
  })

  it('emits save with the quest id and the edited payload', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="edit"]').trigger('click')
    await wrapper.find('[data-test="title"]').setValue('Movie night (rescheduled)')
    await wrapper.find('form').trigger('submit.prevent')

    const [id, payload] = wrapper.emitted('save')[0]
    expect(id).toBe(1)
    expect(payload).toMatchObject({
      title: 'Movie night (rescheduled)',
      category: 'movie',
      lat: 1,
      lng: 2,
    })
  })

  it('closes the edit form once a refreshed quest is supplied (successful save)', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="edit"]').trigger('click')
    expect(wrapper.findComponent(QuestForm).exists()).toBe(true)

    await wrapper.setProps({ quest: { ...quest, title: 'Movie night (rescheduled)' } })

    expect(wrapper.findComponent(QuestForm).exists()).toBe(false)
    expect(wrapper.text()).toContain('Movie night (rescheduled)')
  })

  it('keeps the edit form open when the quest is unchanged (failed save)', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="edit"]').trigger('click')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.findComponent(QuestForm).exists()).toBe(true)
  })

  it('returns to the details view when the edit form is cancelled', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="edit"]').trigger('click')
    await wrapper.find('[data-test="cancel"]').trigger('click')

    expect(wrapper.findComponent(QuestForm).exists()).toBe(false)
    expect(wrapper.find('[data-test="delete"]').exists()).toBe(true)
  })
})
