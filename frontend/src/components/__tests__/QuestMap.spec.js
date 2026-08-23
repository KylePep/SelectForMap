import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import maplibregl from 'maplibre-gl'
import QuestMap from '../QuestMap.vue'
import QuestMarker from '../QuestMarker.vue'
import { apiClient } from '../../lib/apiClient'

vi.mock('maplibre-gl', () => {
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

  return { default: { Map, Marker, __state: state } }
})

vi.mock('../../lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
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

/** Mounts the component and drives it through the map's `load` event. */
async function mountLoadedMap(quests = [quest]) {
  apiClient.get.mockResolvedValue({ data: quests })
  const wrapper = mount(QuestMap)
  await flushPromises()
  state.instances[0].emit('load')
  await flushPromises()
  return wrapper
}

describe('QuestMap', () => {
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
  })

  it('reports questsLoaded: false before the map has finished loading', () => {
    apiClient.get.mockResolvedValue({ data: [] })
    const wrapper = mount(QuestMap)

    const lastStatus = wrapper.emitted('status').at(-1)[0]
    expect(lastStatus).toEqual({ locationError: null, loadError: null, questsLoaded: false })
  })

  it('reports quest-loading status to the parent, including the empty-quests case', async () => {
    const wrapper = await mountLoadedMap([])

    const lastStatus = wrapper.emitted('status').at(-1)[0]
    // jsdom has no navigator.geolocation, so useGeolocation takes its fallback path.
    expect(lastStatus).toEqual({
      locationError: 'Geolocation is unavailable in this browser.',
      loadError: null,
      questsLoaded: true,
    })
  })

  it('reports a load error via status when fetching quests fails', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(QuestMap)
    await flushPromises()
    state.instances[0].emit('load')
    await flushPromises()

    const lastStatus = wrapper.emitted('status').at(-1)[0]
    expect(lastStatus.loadError).toContain('Could not reach the server')
  })

  it('emits pin-requested with the clicked coordinates', async () => {
    const wrapper = await mountLoadedMap()

    state.instances[0].emit('click', { lngLat: { lat: 41, lng: -73 } })
    await flushPromises()

    expect(wrapper.emitted('pin-requested')).toEqual([[{ lat: 41, lng: -73 }]])
  })

  it('emits quest-selected when a marker is clicked', async () => {
    const wrapper = await mountLoadedMap()

    wrapper.findComponent(QuestMarker).vm.$emit('select', quest)
    await flushPromises()

    expect(wrapper.emitted('quest-selected')).toEqual([[quest]])
  })

  it('shows a fallback panel when the map fails to load', async () => {
    apiClient.get.mockResolvedValue({ data: [] })
    const wrapper = mount(QuestMap)
    await flushPromises()

    state.instances[0].emit('error', { error: { message: 'Unauthorized' } })
    await flushPromises()

    expect(wrapper.find('[data-test="map-error"]').text()).toContain('Unable to load the map')
  })

  it('still surfaces the geolocation fallback message when the map fails', async () => {
    apiClient.get.mockResolvedValue({ data: [] })
    const wrapper = mount(QuestMap)
    await flushPromises()

    state.instances[0].emit('error', { error: { message: 'Unauthorized' } })
    await flushPromises()

    // jsdom has no navigator.geolocation, so useGeolocation takes its fallback path.
    expect(wrapper.find('[data-test="map-error"]').text()).toContain('Geolocation is unavailable')
    const lastStatus = wrapper.emitted('status').at(-1)[0]
    expect(lastStatus.locationError).toBe('Geolocation is unavailable in this browser.')
  })

  it('ignores map errors that arrive after the map has already loaded', async () => {
    const wrapper = await mountLoadedMap()

    state.instances[0].emit('error', { error: { message: 'a tile failed' } })
    await flushPromises()

    expect(wrapper.find('[data-test="map-error"]').exists()).toBe(false)
  })
})
