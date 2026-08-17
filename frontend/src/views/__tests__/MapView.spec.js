import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import mapboxgl from 'mapbox-gl'
import MapView from '../MapView.vue'
import QuestMarker from '../../components/QuestMarker.vue'
import QuestForm from '../../components/QuestForm.vue'
import { apiClient } from '../../lib/apiClient'

vi.mock('mapbox-gl', () => {
  const state = { instances: [], markers: [] }

  class Map {
    constructor(options) {
      this.options = options
      this.handlers = {}
      this.flyTo = vi.fn()
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

  return { default: { Map, Marker, accessToken: null, __state: state } }
})

vi.mock('../../lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  }
})

const state = mapboxgl.__state

const quest = {
  id: 1,
  title: 'Movie night',
  description: 'Sci-fi',
  category: 'movie',
  lat: 40.7128,
  lng: -74.006,
  starts_at: '2026-09-01T18:00:00+00:00',
}

/** Mounts the view and drives it through the Mapbox `load` event. */
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

  it('loads quests for the current viewport once the map is ready', async () => {
    const wrapper = await mountLoadedMap()

    expect(apiClient.get).toHaveBeenCalledWith('/quests', {
      params: { min_lat: 40, max_lat: 41, min_lng: -75, max_lng: -74 },
    })
    expect(wrapper.findAllComponents(QuestMarker)).toHaveLength(1)
    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)
  })

  it('shows the empty state when the viewport has no quests', async () => {
    const wrapper = await mountLoadedMap([])

    expect(wrapper.find('[data-test="empty-state"]').text()).toBe(
      'No quests here yet — drop a pin to add one.',
    )
  })

  it('does not show the empty state before quests have loaded', () => {
    apiClient.get.mockResolvedValue({ data: [] })
    const wrapper = mount(MapView)

    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)
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

  it('shows a fallback panel when the map fails to load', async () => {
    apiClient.get.mockResolvedValue({ data: [] })
    const wrapper = mount(MapView)
    await flushPromises()

    state.instances[0].emit('error', { error: { message: 'Unauthorized' } })
    await flushPromises()

    expect(wrapper.find('[data-test="map-error"]').text()).toContain('Unable to load the map')
  })

  it('still surfaces the geolocation fallback message when the map fails', async () => {
    apiClient.get.mockResolvedValue({ data: [] })
    const wrapper = mount(MapView)
    await flushPromises()

    state.instances[0].emit('error', { error: { message: 'Unauthorized' } })
    await flushPromises()

    // jsdom has no navigator.geolocation, so useGeolocation takes its fallback path.
    expect(wrapper.find('.sfm-location-banner').exists()).toBe(true)
    expect(wrapper.find('[data-test="map-error"]').text()).toContain('Geolocation is unavailable')
  })

  it('ignores map errors that arrive after the map has already loaded', async () => {
    const wrapper = await mountLoadedMap()

    state.instances[0].emit('error', { error: { message: 'a tile failed' } })
    await flushPromises()

    expect(wrapper.find('[data-test="map-error"]').exists()).toBe(false)
  })
})
