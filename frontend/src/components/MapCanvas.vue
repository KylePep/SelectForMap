<!-- frontend/src/components/MapCanvas.vue -->
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const emit = defineEmits(['map-ready', 'map-click'])
const mapContainer = ref(null)
let map = null

onMounted(() => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-98.5795, 39.8283],
    zoom: 3,
  })

  map.on('load', () => emit('map-ready', map))
  map.on('click', (e) => emit('map-click', { lat: e.lngLat.lat, lng: e.lngLat.lng }))
})

onBeforeUnmount(() => {
  map?.remove()
})

defineExpose({ getMap: () => map })
</script>

<template>
  <div ref="mapContainer" style="width: 100%; height: 100vh;" />
</template>
