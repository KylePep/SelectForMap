import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AvatarMarker from '../AvatarMarker.vue'

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
  return mount(AvatarMarker, { props: { map, lat: 40.7128, lng: -74.006, ...props } })
}

describe('AvatarMarker', () => {
  beforeEach(() => {
    markers.length = 0
  })

  it('adds a marker to the map at the given coordinates', () => {
    mountMarker()

    expect(markers).toHaveLength(1)
    expect(markers[0].setLngLat).toHaveBeenCalledWith([-74.006, 40.7128])
  })

  it('does not emit home-requested on click when not clickable', () => {
    const wrapper = mountMarker({ clickable: false })

    markers[0].element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('home-requested')).toBeUndefined()
  })

  it('emits home-requested and stops the click from reaching the map when clickable', () => {
    const wrapper = mountMarker({ clickable: true })
    const mapClickHandler = vi.fn()
    document.body.addEventListener('click', mapClickHandler)

    markers[0].element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('home-requested')).toHaveLength(1)
    expect(mapClickHandler).not.toHaveBeenCalled()

    document.body.removeEventListener('click', mapClickHandler)
  })

  it('stops being clickable when the clickable prop turns false', async () => {
    const wrapper = mountMarker({ clickable: true })

    await wrapper.setProps({ clickable: false })
    markers[0].element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('home-requested')).toBeUndefined()
  })

  it('becomes clickable when the clickable prop turns true', async () => {
    const wrapper = mountMarker({ clickable: false })

    await wrapper.setProps({ clickable: true })
    markers[0].element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('home-requested')).toHaveLength(1)
  })

  it('removes the marker when unmounted', () => {
    mountMarker().unmount()

    expect(markers[0].remove).toHaveBeenCalled()
  })
})
