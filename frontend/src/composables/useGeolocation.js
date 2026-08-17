import { ref } from 'vue'

const DEFAULT_POSITION = { lat: 39.8283, lng: -98.5795 } // center of contiguous US

export function useGeolocation() {
  const position = ref(null)
  const error = ref(null)

  function requestLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        error.value = 'Geolocation is unavailable in this browser.'
        position.value = DEFAULT_POSITION
        resolve()
        return
      }

      navigator.geolocation.getCurrentPosition(
        (result) => {
          error.value = null
          position.value = { lat: result.coords.latitude, lng: result.coords.longitude }
          resolve()
        },
        () => {
          error.value = 'Location permission was denied or unavailable.'
          position.value = DEFAULT_POSITION
          resolve()
        },
      )
    })
  }

  return { position, error, requestLocation }
}
