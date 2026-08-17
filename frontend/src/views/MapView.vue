<script setup>
import { ref } from 'vue'
import MapCanvas from '../components/MapCanvas.vue'
import AvatarMarker from '../components/AvatarMarker.vue'
import QuestMarker from '../components/QuestMarker.vue'
import QuestForm from '../components/QuestForm.vue'
import { useGeolocation } from '../composables/useGeolocation'
import { useQuestsStore } from '../stores/quests'
import { boundsChangedSignificantly } from '../utils/bounds'

const map = ref(null)
const { position, error, requestLocation } = useGeolocation()
const questsStore = useQuestsStore()
const showExploreButton = ref(false)
const selectedQuest = ref(null)
const pendingPin = ref(null) // { lat, lng } while the creation form is open

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

function onMapClick({ lat, lng }) {
  pendingPin.value = { lat, lng }
}

async function submitQuest(payload) {
  await questsStore.createQuest(payload)
  pendingPin.value = null
}
</script>

<template>
  <MapCanvas @map-ready="onMapReady" @map-click="onMapClick" />
  <AvatarMarker v-if="map && position" :map="map" :lat="position.lat" :lng="position.lng" />
  <QuestMarker
    v-for="quest in questsStore.quests"
    :key="quest.id"
    :map="map"
    :quest="quest"
    @select="(q) => (selectedQuest = q)"
  />
  <p v-if="error" class="sfm-location-banner">{{ error }} Showing a default location instead.</p>
  <button v-if="showExploreButton" class="sfm-explore-button" @click="exploreThisArea">
    Explore this area
  </button>
  <QuestForm
    v-if="pendingPin"
    :lat="pendingPin.lat"
    :lng="pendingPin.lng"
    @submit="submitQuest"
    @cancel="pendingPin = null"
  />
</template>
