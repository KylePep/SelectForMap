import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import maplibregl from 'maplibre-gl'
import MapView from '../MapView.vue'
import QuestMap from '../../components/QuestMap.vue'
import QuestMarker from '../../components/QuestMarker.vue'
import QuestForm from '../../components/QuestForm.vue'
import AvatarMarker from '../../components/AvatarMarker.vue'
import { apiClient } from '../../lib/apiClient'

// MapView composes QuestMap (the real map surface) with the CRUD panels, so these
// tests still drive a real maplibre-gl map to reach that composition — the map's
// own internal behavior (loading, marker rendering, fallback panel, ...) is
// covered in isolation by QuestMap.spec.js.
vi.mock('maplibre-gl', () => {
  const state = { instances: [], markers: [] }

  class Map {
    constructor(options) {
      this.options = options
      this.handlers = {}
      this.flyTo = vi.fn()
      this.getZoom = () => 10
      this.remove = vi.fn()
      this.getBounds = () => ({
        getSouth: () => 40,
        getNorth: () => 41,
        getWest: () => -75,
        getEast: () => -74,
      })
      state.instances.push(this)
    }

    on(event, handler) {
      this.handlers[event] = handler
    }

    emit(event, payload) {
      this.handlers[event]?.(payload)
    }
  }

  class Marker {
    constructor({ element }) {
      this.element = element
      this.setLngLat = vi.fn(() => this)
      this.addTo = vi.fn(() => this)
      this.remove = vi.fn()
      state.markers.push(this)
    }
  }

  return { default: { Map, Marker, __state: state } }
})

vi.mock('../../lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  }
})

const state = maplibregl.__state

const quest = {
  id: 1,
  title: 'Movie night',
  description: 'Sci-fi',
  category: 'movie',
  lat: 40.7128,
  lng: -74.006,
  starts_at: '2026-09-01T18:00:00+00:00',
}

/** Mounts the view and drives it through the map's `load` event. */
async function mountLoadedMap(quests = [quest]) {
  apiClient.get.mockResolvedValue({ data: quests })
  const wrapper = mount(MapView)
  await flushPromises()
  state.instances[0].emit('load')
  await flushPromises()
  return wrapper
}

describe('MapView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    state.instances.length = 0
    state.markers.length = 0
    vi.clearAllMocks()
  })

  it('shows the empty state when the viewport has no quests', async () => {
    const wrapper = await mountLoadedMap([])

    expect(wrapper.find('[data-test="empty-state"]').text()).toBe(
      'No quests here yet — drop a pin to add one.',
    )
  })

  it('saves an edited quest through the store and shows the updated values', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.put.mockResolvedValue({ data: { ...quest, title: 'Movie night (rescheduled)' } })

    wrapper.findComponent(QuestMarker).vm.$emit('select', quest)
    await flushPromises()

    await wrapper.find('[data-test="edit"]').trigger('click')
    await wrapper.find('[data-test="title"]').setValue('Movie night (rescheduled)')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(apiClient.put).toHaveBeenCalledWith('/quests/1', {
      title: 'Movie night (rescheduled)',
      description: 'Sci-fi',
      category: 'movie',
      lat: 40.7128,
      lng: -74.006,
      starts_at: '2026-09-01T18:00',
    })
    // The edit form closes and the panel shows the refreshed quest.
    expect(wrapper.findComponent(QuestForm).exists()).toBe(false)
    expect(wrapper.text()).toContain('Movie night (rescheduled)')
    expect(wrapper.find('[data-test="api-error"]').exists()).toBe(false)
  })

  it('shows an inline error and keeps the edit form open when saving fails', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.put.mockRejectedValue({
      response: { status: 422, data: { errors: { title: ['The title is required.'] } } },
    })

    wrapper.findComponent(QuestMarker).vm.$emit('select', quest)
    await flushPromises()

    await wrapper.find('[data-test="edit"]').trigger('click')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('[data-test="api-error"]').text()).toBe('The title is required.')
    expect(wrapper.findComponent(QuestForm).exists()).toBe(true)
  })

  it('shows an inline error when deleting fails', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.delete.mockRejectedValue(new Error('Network Error'))

    wrapper.findComponent(QuestMarker).vm.$emit('select', quest)
    await flushPromises()

    await wrapper.find('[data-test="delete"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="api-error"]').text()).toContain('Could not reach the server')
    expect(wrapper.findAllComponents(QuestMarker)).toHaveLength(1)
  })

  it('shows an inline error when creating a quest fails and keeps the form open', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.post.mockRejectedValue({ response: { status: 500, data: {} } })

    state.instances[0].emit('click', { lngLat: { lat: 41, lng: -73 } })
    await flushPromises()

    await wrapper.find('[data-test="title"]').setValue('New quest')
    await wrapper.find('[data-test="starts_at"]').setValue('2026-09-01T18:00')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('[data-test="api-error"]').text()).toBe('Could not create that quest.')
    expect(wrapper.findComponent(QuestForm).exists()).toBe(true)
  })

  it('keeps a create-quest error and a stale quest-load error from rendering on top of each other', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(MapView)
    await flushPromises()
    state.instances[0].emit('load')
    await flushPromises()
    expect(wrapper.find('[data-test="api-error"]').text()).toContain('Could not reach the server')

    apiClient.post.mockRejectedValue({ response: { status: 500, data: {} } })
    state.instances[0].emit('click', { lngLat: { lat: 41, lng: -73 } })
    await flushPromises()
    await wrapper.find('[data-test="title"]').setValue('New quest')
    await wrapper.find('[data-test="starts_at"]').setValue('2026-09-01T18:00')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // Only one error banner exists in the DOM at a time; the CRUD error (a direct
    // result of the user's last action) takes priority over the stale load error.
    expect(wrapper.findAll('[data-test="api-error"]')).toHaveLength(1)
    expect(wrapper.find('[data-test="api-error"]').text()).toBe('Could not create that quest.')
  })

  it('opens a confirmation modal when the avatar marker requests setting home base', async () => {
    const wrapper = await mountLoadedMap()

    wrapper.findComponent(AvatarMarker).vm.$emit('home-requested')
    await flushPromises()

    expect(wrapper.find('[data-test="modal-backdrop"]').exists()).toBe(true)
  })

  it('sets the home base when the confirmation is accepted', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.patch.mockResolvedValue({ data: { home_lat: 39.8283, home_lng: -98.5795 } })

    wrapper.findComponent(AvatarMarker).vm.$emit('home-requested')
    await flushPromises()
    await wrapper.find('[data-test="confirm-home-yes"]').trigger('click')
    await flushPromises()

    expect(apiClient.patch).toHaveBeenCalledWith('/profile', { home_lat: 39.8283, home_lng: -98.5795 })
    expect(wrapper.find('[data-test="modal-backdrop"]').exists()).toBe(false)
  })

  it('shows an inline error and keeps the confirmation open when setting home base fails', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.patch.mockRejectedValue(new Error('Network Error'))

    wrapper.findComponent(AvatarMarker).vm.$emit('home-requested')
    await flushPromises()
    await wrapper.find('[data-test="confirm-home-yes"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="api-error"]').text()).toContain('Could not reach the server')
    expect(wrapper.find('[data-test="modal-backdrop"]').exists()).toBe(true)
  })

  it('closes the confirmation modal without setting home base on No', async () => {
    const wrapper = await mountLoadedMap()

    wrapper.findComponent(AvatarMarker).vm.$emit('home-requested')
    await flushPromises()
    await wrapper.find('[data-test="confirm-home-no"]').trigger('click')
    await flushPromises()

    expect(apiClient.patch).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="modal-backdrop"]').exists()).toBe(false)
  })

  it('sets home base from the Home Base off-canvas menu', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.patch.mockResolvedValue({ data: { home_lat: 39.8283, home_lng: -98.5795 } })

    await wrapper.find('.sfm-canvas-button').trigger('click')
    await wrapper.find('[data-test="home-base-menu-button"]').trigger('click')
    await wrapper.find('[data-test="set-home-from-menu"]').trigger('click')
    await flushPromises()

    expect(apiClient.patch).toHaveBeenCalledWith('/profile', { home_lat: 39.8283, home_lng: -98.5795 })
  })

  it('shows an inline error when setting home base from the menu fails', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.patch.mockRejectedValue(new Error('Network Error'))

    await wrapper.find('.sfm-canvas-button').trigger('click')
    await wrapper.find('[data-test="home-base-menu-button"]').trigger('click')
    await wrapper.find('[data-test="set-home-from-menu"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="api-error"]').text()).toContain('Could not reach the server')
  })

  it('disables the off-canvas "set home base" button until a position is available', async () => {
    const wrapper = await mountLoadedMap()
    // jsdom resolves useGeolocation's fallback within the same microtask flush as any
    // `trigger()`, so a real "position not yet available" state can't be raced via
    // timing — simulate it directly via the same status event QuestMap emits.
    wrapper.findComponent(QuestMap).vm.$emit('status', {
      locationError: null,
      loadError: null,
      questsLoaded: true,
      position: null,
    })
    await flushPromises()

    await wrapper.find('.sfm-canvas-button').trigger('click')
    await wrapper.find('[data-test="home-base-menu-button"]').trigger('click')

    expect(wrapper.find('[data-test="set-home-from-menu"]').attributes('disabled')).toBeDefined()
  })
})
