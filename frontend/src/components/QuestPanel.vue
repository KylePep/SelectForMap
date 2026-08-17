<!-- frontend/src/components/QuestPanel.vue -->
<script setup>
import { ref, watch } from 'vue'
import QuestForm from './QuestForm.vue'

const props = defineProps({ quest: { type: Object, required: true } })
const emit = defineEmits(['close', 'delete', 'save'])

const isEditing = ref(false)

// A successful save swaps in a fresh quest object from the store, which closes
// the edit form. A failed save leaves the same object in place, so the form stays
// open with the user's input intact.
watch(
  () => props.quest,
  () => {
    isEditing.value = false
  },
)

function onSave(payload) {
  emit('save', props.quest.id, payload)
}
</script>

<template>
  <QuestForm
    v-if="isEditing"
    :quest="quest"
    @submit="onSave"
    @cancel="isEditing = false"
  />
  <div v-else class="sfm-quest-panel">
    <button data-test="close" class="sfm-quest-panel__close" @click="emit('close')">&times;</button>
    <h3>{{ quest.title }}</h3>
    <p>{{ quest.description }}</p>
    <p>{{ quest.category }} &middot; {{ quest.starts_at }}</p>
    <div class="sfm-quest-panel__actions">
      <button data-test="edit" @click="isEditing = true">Edit</button>
      <button data-test="delete" @click="emit('delete', quest.id)">Delete</button>
    </div>
  </div>
</template>

<style scoped>
.sfm-quest-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 2px solid var(--sfm-panel-border);
  background: var(--sfm-panel-bg);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}

.sfm-quest-panel__close {
  align-self: flex-end;
}

.sfm-quest-panel__actions {
  display: flex;
  gap: 0.5rem;
}
</style>
