<!-- frontend/src/components/QuestMap.vue -->
<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import MapCanvas from './MapCanvas.vue'
import AvatarMarker from './AvatarMarker.vue'
import HomeMarker from './HomeMarker.vue'
import QuestMarker from './QuestMarker.vue'
import { useGeolocation } from '../composables/useGeolocation'
import { useQuestsStore } from '../stores/quests'
import { useProfileStore } from '../stores/profile'
import { boundsChangedSignificantly } from '../utils/bounds.js'
import { apiErrorMessage } from '../lib/apiClient'

const emit = defineEmits(['pin-requested', 'quest-selected', 'status', 'home-requested'])

// shallowRef, not ref: a maplibre-gl Map holds a large internal object graph that
// must not be wrapped in a deep reactive Proxy (breaks identity/WeakMap lookups
// inside MapLibre and costs a lot of needless reactivity work).
const map = shallowRef(null)
const { position, error, requestLocation } = useGeolocation()
const questsStore = useQuestsStore()
const profileStore = useProfileStore()
const showExploreButton = ref(false)
const mapError = ref(null)
const mapLoaded = ref(false)
const apiError = ref(null)
const questsLoaded = ref(false)

// MapView owns the single top-of-screen banner stack (it also has to fold in its
// own quest-create/save/delete errors), so status is reported up rather than
// rendered here — otherwise two independent fixed-position banner stacks could
// end up stacked on top of each other.
const status = computed(() => ({
  locationError: error.value,
  loadError: apiError.value,
  questsLoaded: questsLoaded.value,
  position: position.value,
}))
watch(status, (value) => emit('status', value), { immediate: true })

function currentMapBounds() {
  const b = map.value.getBounds()
  return { min_lat: b.getSouth(), max_lat: b.getNorth(), min_lng: b.getWest(), max_lng: b.getEast() }
}

function centerOnPosition(toPosition) {
  if (!map.value || !toPosition) return
  const zoom = Math.max(map.value.getZoom(), 12)
  map.value.flyTo({ center: [toPosition.lng, toPosition.lat], zoom })
}

function centerOnHomeBase() {
  centerOnPosition({ lat: profileStore.homeLat, lng: profileStore.homeLng })
}

// On a geolocation failure, a saved home base is a better starting view than the
// hardcoded contiguous-US default useGeolocation falls back to.
function initialCenter() {
  if (error.value && profileStore.hasHomeBase) {
    return { lat: profileStore.homeLat, lng: profileStore.homeLng }
  }
  return position.value
}

async function loadQuests() {
  apiError.value = null
  try {
    await questsStore.fetchQuestsInBounds(currentMapBounds())
    questsLoaded.value = true
    return true
  } catch (e) {
    apiError.value = apiErrorMessage(e, 'Could not load quests for this area.')
    return false
  }
}

// Geolocation is requested independently of the map so that a map failure can never
// suppress the "location denied" fallback (and vice versa).
onMounted(async () => {
  await requestLocation()
  centerOnPosition(position.value)
})

async function onMapReady(mapInstance) {
  map.value = mapInstance
  mapLoaded.value = true
  mapError.value = null
  await profileStore.fetchProfile()
  centerOnPosition(initialCenter())
  await loadQuests()

  map.value.on('moveend', () => {
    showExploreButton.value = boundsChangedSignificantly(questsStore.lastLoadedBounds, currentMapBounds())
  })
}

// Only a failure *before* the map ever became usable is a dead end worth taking
// the screen over; once the map has loaded, a stray tile error must not tear down
// a working map.
function onMapError({ message }) {
  if (!mapLoaded.value) {
    mapError.value = message
  }
}

async function exploreThisArea() {
  if (await loadQuests()) {
    showExploreButton.value = false
  }
}

function onMapClick({ lat, lng }) {
  emit('pin-requested', { lat, lng })
}

function onQuestSelected(quest) {
  emit('quest-selected', quest)
  centerOnPosition(quest)
}

function onHomeRequested() {
  emit('home-requested')
}
</script>

<template>
  <!-- The canvas stays mounted even on an error so a recoverable failure can clear
       itself; the fallback panel simply covers it. -->
  <MapCanvas @map-ready="onMapReady" @map-click="onMapClick" @map-error="onMapError" />

  <template v-if="map">
    <AvatarMarker v-if="position" :map="map" :lat="position.lat" :lng="position.lng"
      :clickable="!profileStore.hasHomeBase" @home-requested="onHomeRequested" />
    <HomeMarker v-if="profileStore.hasHomeBase" :map="map" :lat="profileStore.homeLat" :lng="profileStore.homeLng" />
    <QuestMarker v-for="quest in questsStore.quests" :key="quest.id" :map="map" :quest="quest"
      @select="onQuestSelected" />
  </template>

  <template class="sfm-hud-buttons">
    <button v-if="profileStore.hasHomeBase" class="sfm-home-button" data-test="home-button" @click="centerOnHomeBase">
      <img src="/sprites/home-marker.svg" alt="home button">
    </button>

    <button v-if="showExploreButton" class="sfm-explore-button" @click="exploreThisArea">
      Explore this area
    </button>
  </template>

  <div v-if="mapError" class="sfm-map-error" data-test="map-error">
    <h2>Map unavailable</h2>
    <p>{{ mapError }}</p>
    <p v-if="error" class="sfm-map-error__note">
      {{ error }}
    </p>
  </div>
</template>
