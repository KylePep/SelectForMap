import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestMarker from '../QuestMarker.vue'
import { colorForCategory, iconForCategory } from '../../utils/categoryIcons'

const markers = []

vi.mock('mapbox-gl', () => {
  class Marker {
    constructor({ element }) {
      this.element = element
      this.lngLat = null
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

const quest = { id: 1, title: 'Movie night', category: 'movie', lat: 40.7128, lng: -74.006 }
const map = { fake: 'map' }

function mountMarker(props = {}) {
  return mount(QuestMarker, { props: { map, quest, ...props }, attachTo: document.body })
}

describe('QuestMarker', () => {
  beforeEach(() => {
    markers.length = 0
  })

  it('adds a marker to the map at the quest coordinates', () => {
    mountMarker()

    expect(markers).toHaveLength(1)
    expect(markers[0].setLngLat).toHaveBeenCalledWith([-74.006, 40.7128])
    expect(markers[0].addTo).toHaveBeenCalledWith(map)
  })

  it('renders a visible marker element even without sprite assets', () => {
    mountMarker()

    const el = markers[0].element
    expect(el.style.backgroundImage).toContain(iconForCategory('movie'))
    expect(el.style.borderRadius).toBe('50%')
    // A background color guarantees the marker is a visible, clickable target.
    expect(el.style.backgroundColor).not.toBe('')
  })

  it('emits select and stops the click from reaching the map handler', () => {
    const wrapper = mountMarker()
    const mapClickHandler = vi.fn()
    document.body.addEventListener('click', mapClickHandler)

    markers[0].element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('select')[0]).toEqual([quest])
    expect(mapClickHandler).not.toHaveBeenCalled()

    document.body.removeEventListener('click', mapClickHandler)
  })

  it('moves the marker when the quest coordinates change', async () => {
    const wrapper = mountMarker()

    await wrapper.setProps({ quest: { ...quest, lat: 51.5, lng: -0.12 } })

    expect(markers[0].setLngLat).toHaveBeenLastCalledWith([-0.12, 51.5])
  })

  it('updates the icon and color when the quest category changes', async () => {
    const wrapper = mountMarker()

    await wrapper.setProps({ quest: { ...quest, category: 'outdoors' } })

    const el = markers[0].element
    expect(el.style.backgroundImage).toContain(iconForCategory('outdoors'))
    expect(el.style.backgroundColor).toBe(hexToRgb(colorForCategory('outdoors')))
  })

  it('removes the marker when unmounted', () => {
    mountMarker().unmount()

    expect(markers[0].remove).toHaveBeenCalled()
  })
})

// jsdom normalizes inline color values to rgb() form.
function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}
