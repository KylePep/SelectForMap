<script setup>
import { ref } from 'vue'
import MapCanvas from '../components/MapCanvas.vue'
import AvatarMarker from '../components/AvatarMarker.vue'
import { useGeolocation } from '../composables/useGeolocation'

const map = ref(null)
const { position, error, requestLocation } = useGeolocation()

async function onMapReady(mapInstance) {
  map.value = mapInstance
  await requestLocation()
  if (position.value) {
    map.value.flyTo({ center: [position.value.lng, position.value.lat], zoom: 12 })
  }
}
</script>

<template>
  <MapCanvas @map-ready="onMapReady" />
  <AvatarMarker v-if="map && position" :map="map" :lat="position.lat" :lng="position.lng" />
  <p v-if="error" class="sfm-location-banner">{{ error }} Showing a default location instead.</p>
</template>
