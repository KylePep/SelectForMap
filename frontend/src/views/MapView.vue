<script setup>
import { onMounted, ref, shallowRef } from 'vue'
import MapCanvas from '../components/MapCanvas.vue'
import AvatarMarker from '../components/AvatarMarker.vue'
import QuestMarker from '../components/QuestMarker.vue'
import QuestForm from '../components/QuestForm.vue'
import QuestPanel from '../components/QuestPanel.vue'
import { useGeolocation } from '../composables/useGeolocation'
import { useQuestsStore } from '../stores/quests'
import { boundsChangedSignificantly } from '../utils/bounds'
import { apiErrorMessage } from '../lib/apiClient'

// shallowRef, not ref: a mapbox-gl Map holds a large internal object graph that
// must not be wrapped in a deep reactive Proxy (breaks identity/WeakMap lookups
// inside Mapbox and costs a lot of needless reactivity work).
const map = shallowRef(null)
const { position, error, requestLocation } = useGeolocation()
const questsStore = useQuestsStore()
const showExploreButton = ref(false)
const selectedQuest = ref(null)
const pendingPin = ref(null) // { lat, lng } while the creation form is open
const mapError = ref(null)
const mapLoaded = ref(false)
const apiError = ref(null)
const questsLoaded = ref(false)

function currentMapBounds() {
  const b = map.value.getBounds()
  return { min_lat: b.getSouth(), max_lat: b.getNorth(), min_lng: b.getWest(), max_lng: b.getEast() }
}

function centerOnPosition() {
  if (!map.value || !position.value) return
  map.value.flyTo({ center: [position.value.lng, position.value.lat], zoom: 12 })
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

// Geolocation is requested independently of Mapbox so that a map failure can never
// suppress the "location denied" fallback (and vice versa).
onMounted(async () => {
  await requestLocation()
  centerOnPosition()
})

async function onMapReady(mapInstance) {
  map.value = mapInstance
  mapLoaded.value = true
  mapError.value = null
  centerOnPosition()
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
  // Only one HUD panel at a time.
  selectedQuest.value = null
  pendingPin.value = { lat, lng }
}

function onQuestSelected(quest) {
  pendingPin.value = null
  selectedQuest.value = quest
}

async function submitQuest(payload) {
  apiError.value = null
  try {
    await questsStore.createQuest(payload)
    pendingPin.value = null
  } catch (e) {
    apiError.value = apiErrorMessage(e, 'Could not create that quest.')
  }
}

async function saveQuest(id, payload) {
  apiError.value = null
  try {
    // Swapping in the freshly returned quest also closes QuestPanel's edit form.
    selectedQuest.value = await questsStore.updateQuest(id, payload)
  } catch (e) {
    apiError.value = apiErrorMessage(e, 'Could not save that quest.')
  }
}

async function deleteSelectedQuest(id) {
  apiError.value = null
  try {
    await questsStore.deleteQuest(id)
    selectedQuest.value = null
  } catch (e) {
    apiError.value = apiErrorMessage(e, 'Could not delete that quest.')
  }
}
</script>

<template>
  <!-- The canvas stays mounted even on an error so a recoverable failure can clear
       itself; the fallback panel simply covers it. -->
  <MapCanvas @map-ready="onMapReady" @map-click="onMapClick" @map-error="onMapError" />

  <template v-if="map">
    <AvatarMarker v-if="position" :map="map" :lat="position.lat" :lng="position.lng" />
    <QuestMarker
      v-for="quest in questsStore.quests"
      :key="quest.id"
      :map="map"
      :quest="quest"
      @select="onQuestSelected"
    />
  </template>

  <div class="sfm-hud-top">
    <p v-if="error" class="sfm-location-banner">{{ error }} Showing a default location instead.</p>
    <p v-if="apiError" class="sfm-api-error" data-test="api-error">{{ apiError }}</p>
    <p
      v-if="questsLoaded && !apiError && questsStore.quests.length === 0"
      class="sfm-empty-state"
      data-test="empty-state"
    >
      No quests here yet — drop a pin to add one.
    </p>
  </div>

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
  <QuestPanel
    v-if="selectedQuest"
    :quest="selectedQuest"
    @close="selectedQuest = null"
    @delete="deleteSelectedQuest"
    @save="saveQuest"
  />

  <div v-if="mapError" class="sfm-map-error" data-test="map-error">
    <h2>Map unavailable</h2>
    <p>{{ mapError }}</p>
    <p v-if="error" class="sfm-map-error__note">
      {{ error }}
    </p>
  </div>
</template>
