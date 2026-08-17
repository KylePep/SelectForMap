<script setup>
import { ref } from 'vue'
import MapCanvas from '../components/MapCanvas.vue'
import AvatarMarker from '../components/AvatarMarker.vue'
import { useGeolocation } from '../composables/useGeolocation'
import { useQuestsStore } from '../stores/quests'
import { boundsChangedSignificantly } from '../utils/bounds'

const map = ref(null)
const { position, error, requestLocation } = useGeolocation()
const questsStore = useQuestsStore()
const showExploreButton = ref(false)

function currentMapBounds() {
  const b = map.value.getBounds()
  return { min_lat: b.getSouth(), max_lat: b.getNorth(), min_lng: b.getWest(), max_lng: b.getEast() }
}

async function onMapReady(mapInstance) {
  map.value = mapInstance
  await requestLocation()
  if (position.value) {
    map.value.flyTo({ center: [position.value.lng, position.value.lat], zoom: 12 })
  }
  await questsStore.fetchQuestsInBounds(currentMapBounds())

  map.value.on('moveend', () => {
    showExploreButton.value = boundsChangedSignificantly(questsStore.lastLoadedBounds, currentMapBounds())
  })
}

async function exploreThisArea() {
  await questsStore.fetchQuestsInBounds(currentMapBounds())
  showExploreButton.value = false
}
</script>

<template>
  <MapCanvas @map-ready="onMapReady" />
  <AvatarMarker v-if="map && position" :map="map" :lat="position.lat" :lng="position.lng" />
  <p v-if="error" class="sfm-location-banner">{{ error }} Showing a default location instead.</p>
  <button v-if="showExploreButton" class="sfm-explore-button" @click="exploreThisArea">
    Explore this area
  </button>
</template>
