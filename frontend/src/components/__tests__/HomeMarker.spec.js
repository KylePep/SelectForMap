import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeMarker from '../HomeMarker.vue'

const markers = []

vi.mock('maplibre-gl', () => {
  class Marker {
    constructor({ element }) {
      this.element = element
      this.setLngLat = vi.fn((lngLat) => {
        this.lngLat = lngLat
        return this
      })
      this.addTo = vi.fn(() => this)
      this.remove = vi.fn()
      markers.push(this)
    }
  }
  return { default: { Marker } }
})

const map = { fake: 'map' }

function mountMarker(props = {}) {
  return mount(HomeMarker, { props: { map, lat: 40.7128, lng: -74.006, ...props } })
}

describe('HomeMarker', () => {
  beforeEach(() => {
    markers.length = 0
  })

  it('adds a marker to the map at the given coordinates', () => {
    mountMarker()

    expect(markers).toHaveLength(1)
    expect(markers[0].setLngLat).toHaveBeenCalledWith([-74.006, 40.7128])
    expect(markers[0].addTo).toHaveBeenCalledWith(map)
  })

  it('renders a visible marker, styled distinctly from the avatar marker', () => {
    mountMarker()

    const el = markers[0].element
    expect(el.style.backgroundColor).not.toBe('')
    // The avatar marker is a 50% (circular) radius; home base is visually distinct.
    expect(el.style.borderRadius).toBe('6px')
  })

  it('moves the marker when the coordinates change', async () => {
    const wrapper = mountMarker()

    await wrapper.setProps({ lat: 51.5, lng: -0.12 })

    expect(markers[0].setLngLat).toHaveBeenLastCalledWith([-0.12, 51.5])
  })

  it('removes the marker when unmounted', () => {
    mountMarker().unmount()

    expect(markers[0].remove).toHaveBeenCalled()
  })
})
