<script setup>
import { computed, ref } from 'vue'
import QuestMap from '../components/QuestMap.vue'
import QuestForm from '../components/QuestForm.vue'
import QuestPanel from '../components/QuestPanel.vue'
import PinTypePicker from '../components/PinTypePicker.vue'
import OffCanvas from '../components/OffCanvas.vue'
import { useQuestsStore } from '../stores/quests'
import { useProfileStore } from '../stores/profile'
import { apiErrorMessage } from '../lib/apiClient'
import Modal from '@/components/Modal.vue'

const questsStore = useQuestsStore()
const profileStore = useProfileStore()
const showOffCanvas = ref(false)
const showHomeMenu = ref(false)
const showHomeConfirm = ref(false)
const showMyQuestsMenu = ref(false)
const showSettingsMenu = ref(false)
const selectedQuest = ref(null)
const pendingPin = ref(null) // { lat, lng } while the type-picker bar is open
const showQuestModal = ref(false)
const questModalQuest = ref(null) // set when editing an existing pin; null when creating
const questModalType = ref('quest') // type chosen from the picker, used only when creating
const crudError = ref(null)
const mapStatus = ref({ locationError: null, loadError: null, questsLoaded: false, position: null })

const questTypeLabels = { quest: 'Quest', recurring_quest: 'Recurring Quest', memory: 'Memory' }
const questModalTitle = computed(() => {
  const type = questModalQuest.value?.type ?? questModalType.value
  const label = questTypeLabels[type]
  return questModalQuest.value ? `Edit ${label}` : `New ${label}`
})

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

function onPinTypeChosen(type) {
  questModalQuest.value = null
  questModalType.value = type
  showQuestModal.value = true
}

function onPinTypeCancelled() {
  pendingPin.value = null
}

function onEditRequested(quest) {
  questModalQuest.value = quest
  showQuestModal.value = true
}

function closeQuestModal() {
  showQuestModal.value = false
  pendingPin.value = null
  questModalQuest.value = null
}

async function submitQuest(payload) {
  crudError.value = null
  const editing = questModalQuest.value
  try {
    if (editing) {
      selectedQuest.value = await questsStore.updateQuest(editing.id, payload)
    } else {
      await questsStore.createQuest(payload)
    }
    closeQuestModal()
  } catch (e) {
    crudError.value = apiErrorMessage(e, editing ? 'Could not save that quest.' : 'Could not create that quest.')
  }
}

async function saveQuest(id, payload) {
  crudError.value = null
  try {
    // Swapping in the freshly returned quest also closes QuestPanel's complete-choices view.
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

function onHomeRequested() {
  showHomeConfirm.value = true
}

async function confirmSetHome() {
  crudError.value = null
  try {
    await profileStore.setHomeLocation(mapStatus.value.position)
    showHomeConfirm.value = false
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not set that as your home base.')
  }
}

async function setHomeFromMenu() {
  crudError.value = null
  try {
    await profileStore.setHomeLocation(mapStatus.value.position)
    showHomeMenu.value = false
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not set that as your home base.')
  }
}
</script>

<template>
  <div class="sfm-canvas-button h-10 w-10 rounded-full bg-blue-500 flex items-center justify-content-center"
    @click="showOffCanvas = true">
    <img src="/sprites/menu.svg" alt="menu button" class="h-6 w-6 m-auto">
  </div>

  <QuestMap @pin-requested="onPinRequested" @quest-selected="onQuestSelected" @status="onMapStatus"
    @home-requested="onHomeRequested" />

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

  <PinTypePicker v-if="pendingPin && !showQuestModal" @select="onPinTypeChosen" @cancel="onPinTypeCancelled" />

  <Modal :model-value="showQuestModal" :title="questModalTitle" @update:model-value="closeQuestModal">
    <QuestForm :type="questModalType" :lat="pendingPin?.lat" :lng="pendingPin?.lng" :quest="questModalQuest"
      @submit="submitQuest" @cancel="closeQuestModal" />
  </Modal>

  <QuestPanel v-if="selectedQuest" :quest="selectedQuest" @close="selectedQuest = null" @delete="deleteSelectedQuest"
    @save="saveQuest" @edit="onEditRequested" />

  <OffCanvas v-model="showOffCanvas" title="Menu" class="sfm-off-canvas">
    <button type="button" data-test="home-base-menu-button" @click="showHomeMenu = true">Home Base</button>
    <button type="button" @click="showMyQuestsMenu = true">My Quests</button>
    <button type="button" @click="showSettingsMenu = true">Settings</button>
  </OffCanvas>

  <Modal v-model="showHomeConfirm" title="Set Home Base?">
    <p>Set your current location as your home base?</p>
    <div class="sfm-home-confirm__actions">
      <button type="button" data-test="confirm-home-yes" @click="confirmSetHome">Yes</button>
      <button type="button" data-test="confirm-home-no" @click="showHomeConfirm = false">No</button>
    </div>
  </Modal>
  <Modal v-model="showHomeMenu">
    <div class="sfm-home-menu">
      <header>
        <h2>HOME BASE MENU</h2>
      </header>
      <button type="button" data-test="set-home-from-menu" :disabled="!mapStatus.position" @click="setHomeFromMenu">
        Set current location as Home Base
      </button>
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
