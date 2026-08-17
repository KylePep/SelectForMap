<!-- frontend/src/components/MapCanvas.vue -->
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const emit = defineEmits(['map-ready', 'map-click', 'map-error'])
const mapContainer = ref(null)
let map = null
let reportedError = false

const LOAD_FAILURE_MESSAGE = 'Unable to load the map. Please check your connection or try again later.'

// Mapbox emits a stream of `error` events (one per failed tile request, for example);
// the view only ever needs to be told once.
function reportError(detail) {
  if (reportedError) return
  reportedError = true
  emit('map-error', { message: LOAD_FAILURE_MESSAGE, detail })
}

onMounted(() => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

  try {
    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 3,
    })
  } catch (error) {
    // Thrown synchronously for e.g. a missing access token or an unsupported browser.
    reportError(error?.message ?? String(error))
    return
  }

  map.on('load', () => emit('map-ready', map))
  map.on('click', (e) => emit('map-click', { lat: e.lngLat.lat, lng: e.lngLat.lng }))
  map.on('error', (e) => reportError(e?.error?.message ?? 'Mapbox reported an error.'))
})

onBeforeUnmount(() => {
  map?.remove()
})

defineExpose({ getMap: () => map })
</script>

<template>
  <div ref="mapContainer" class="sfm-map-canvas" />
</template>

<style scoped>
/* Full-bleed base layer: every HUD element (banners, buttons, panels) is fixed
   with a higher z-index and sits on top of this. */
.sfm-map-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
}
</style>
