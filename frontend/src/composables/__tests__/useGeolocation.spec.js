import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGeolocation } from '../useGeolocation'

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { geolocation: undefined })
  })

  it('falls back to the default position when geolocation is unavailable', async () => {
    const { position, error, requestLocation } = useGeolocation()

    await requestLocation()

    expect(error.value).toBe('Geolocation is unavailable in this browser.')
    expect(position.value).toEqual({ lat: 39.8283, lng: -98.5795 })
  })

  it('uses the browser position when geolocation succeeds', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (success) =>
          success({ coords: { latitude: 40.7128, longitude: -74.006 } }),
      },
    })

    const { position, error, requestLocation } = useGeolocation()
    await requestLocation()

    expect(error.value).toBeNull()
    expect(position.value).toEqual({ lat: 40.7128, lng: -74.006 })
  })

  it('falls back to the default position when the browser denies permission', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (_success, failure) => failure(new Error('denied')),
      },
    })

    const { position, error, requestLocation } = useGeolocation()
    await requestLocation()

    expect(error.value).toBe('Location permission was denied or unavailable.')
    expect(position.value).toEqual({ lat: 39.8283, lng: -98.5795 })
  })
})
