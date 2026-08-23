<script setup>
import { ref } from 'vue'
import QuestMap from '../components/QuestMap.vue'
import QuestForm from '../components/QuestForm.vue'
import QuestPanel from '../components/QuestPanel.vue'
import OffCanvas from '../components/OffCanvas.vue'
import { useQuestsStore } from '../stores/quests'
import { apiErrorMessage } from '../lib/apiClient'
import Modal from '@/components/Modal.vue'

const questsStore = useQuestsStore()
const showOffCanvas = ref(false)
const showHomeMenu = ref(false)
const showMyQuestsMenu = ref(false)
const showSettingsMenu = ref(false)
const selectedQuest = ref(null)
const pendingPin = ref(null) // { lat, lng } while the creation form is open
const crudError = ref(null)
const mapStatus = ref({ locationError: null, loadError: null, questsLoaded: false })

function onMapStatus(status) {
  mapStatus.value = status
}

function onPinRequested({ lat, lng }) {
  // Only one HUD panel at a time.
  selectedQuest.value = null
  pendingPin.value = { lat, lng }
}

function onQuestSelected(quest) {
  pendingPin.value = null
  selectedQuest.value = quest
}

async function submitQuest(payload) {
  crudError.value = null
  try {
    await questsStore.createQuest(payload)
    pendingPin.value = null
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not create that quest.')
  }
}

async function saveQuest(id, payload) {
  crudError.value = null
  try {
    // Swapping in the freshly returned quest also closes QuestPanel's edit form.
    selectedQuest.value = await questsStore.updateQuest(id, payload)
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not save that quest.')
  }
}

async function deleteSelectedQuest(id) {
  crudError.value = null
  try {
    await questsStore.deleteQuest(id)
    selectedQuest.value = null
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not delete that quest.')
  }
}
</script>

<template>
  <div class="sfm-canvas-button h-10 w-10 rounded-full bg-blue-500" @click="showOffCanvas = true"></div>

  <QuestMap @pin-requested="onPinRequested" @quest-selected="onQuestSelected" @status="onMapStatus" />

  <div class="sfm-hud-top">
    <p v-if="mapStatus.locationError" class="sfm-location-banner">
      {{ mapStatus.locationError }} Showing a default location instead.
    </p>
    <!-- A CRUD error is a direct result of the user's last action, so it takes
         priority over a (possibly stale) quest-loading error from QuestMap. -->
    <p v-if="crudError || mapStatus.loadError" class="sfm-api-error" data-test="api-error">
      {{ crudError || mapStatus.loadError }}
    </p>
    <p v-if="mapStatus.questsLoaded && !crudError && !mapStatus.loadError && questsStore.quests.length === 0"
      class="sfm-empty-state" data-test="empty-state">
      No quests here yet — drop a pin to add one.
    </p>
  </div>

  <QuestForm v-if="pendingPin" :lat="pendingPin.lat" :lng="pendingPin.lng" @submit="submitQuest"
    @cancel="pendingPin = null" />
  <QuestPanel v-if="selectedQuest" :quest="selectedQuest" @close="selectedQuest = null" @delete="deleteSelectedQuest"
    @save="saveQuest" />

  <OffCanvas v-model="showOffCanvas" title="Menu" class="sfm-off-canvas">
    <button type="button" @click="showHomeMenu = true">Home Base</button>
    <button type="button" @click="showMyQuestsMenu = true">My Quests</button>
    <button type="button" @click="showSettingsMenu = true">Settings</button>
  </OffCanvas>

  <Modal v-model="showHomeMenu">
    <div class="sfm-home-menu">
      <header>
        <h2>HOME BASE MENU</h2>
      </header>
    </div>
  </Modal>
  <Modal v-model="showMyQuestsMenu">
    <div class="sfm-my-quests-menu">
      <header>
        <h2>MY QUESTS MENU</h2>
      </header>
    </div>
  </Modal>
  <Modal v-model="showSettingsMenu">
    <div class="sfm-settings-menu">
      <header>
        <h2>SETTINGS MENU</h2>
      </header>
    </div>
  </Modal>
</template>
