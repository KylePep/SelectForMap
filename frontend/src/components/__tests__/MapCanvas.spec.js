import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MapCanvas from '../MapCanvas.vue'
import mapboxgl from 'mapbox-gl'

// A minimal fake of the bits of mapbox-gl this component touches, so the
// load/error wiring can be exercised without a real token or network.
vi.mock('mapbox-gl', () => {
  const state = { constructorThrows: null, instances: [] }

  class Map {
    constructor(options) {
      if (state.constructorThrows) throw state.constructorThrows
      this.options = options
      this.handlers = {}
      this.remove = vi.fn()
      state.instances.push(this)
    }

    on(event, handler) {
      this.handlers[event] = handler
    }

    emit(event, payload) {
      this.handlers[event]?.(payload)
    }
  }

  return { default: { Map, accessToken: null, __state: state } }
})

const state = mapboxgl.__state

describe('MapCanvas', () => {
  beforeEach(() => {
    state.constructorThrows = null
    state.instances.length = 0
  })

  it('emits map-ready with the map instance once it loads', () => {
    const wrapper = mount(MapCanvas)

    state.instances[0].emit('load')

    expect(wrapper.emitted('map-ready')[0][0]).toBe(state.instances[0])
    expect(wrapper.emitted('map-error')).toBeUndefined()
  })

  it('emits map-click with the clicked coordinates', () => {
    const wrapper = mount(MapCanvas)

    state.instances[0].emit('click', { lngLat: { lat: 40.7128, lng: -74.006 } })

    expect(wrapper.emitted('map-click')[0][0]).toEqual({ lat: 40.7128, lng: -74.006 })
  })

  it('emits map-error when the map constructor throws (e.g. a bad token)', () => {
    state.constructorThrows = new Error('An API access token is required to use Mapbox GL JS.')

    const wrapper = mount(MapCanvas)

    expect(state.instances).toHaveLength(0)
    expect(wrapper.emitted('map-error')[0][0].message).toBe(
      'Unable to load the map. Please check your connection or try again later.',
    )
  })

  it('emits map-error when mapbox reports a runtime error', () => {
    const wrapper = mount(MapCanvas)

    state.instances[0].emit('error', { error: { message: 'Unauthorized' } })

    expect(wrapper.emitted('map-error')).toHaveLength(1)
    expect(wrapper.emitted('map-error')[0][0].detail).toBe('Unauthorized')
  })

  it('reports repeated mapbox errors only once', () => {
    const wrapper = mount(MapCanvas)

    state.instances[0].emit('error', { error: { message: 'tile 1 failed' } })
    state.instances[0].emit('error', { error: { message: 'tile 2 failed' } })

    expect(wrapper.emitted('map-error')).toHaveLength(1)
  })

  it('removes the map on unmount', () => {
    const wrapper = mount(MapCanvas)
    const instance = state.instances[0]

    wrapper.unmount()

    expect(instance.remove).toHaveBeenCalled()
  })
})
