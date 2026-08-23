<!-- frontend/src/components/QuestPanel.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({ quest: { type: Object, required: true } })
const emit = defineEmits(['close', 'delete', 'save', 'edit'])

const showCompleteChoices = ref(false)

function erase() {
  emit('delete', props.quest.id)
  showCompleteChoices.value = false
}

function convertTo(type) {
  emit('save', props.quest.id, {
    title: props.quest.title,
    description: props.quest.description,
    category: props.quest.category,
    lat: props.quest.lat,
    lng: props.quest.lng,
    type,
    starts_at: null,
    completed_at: new Date().toISOString(),
  })
  showCompleteChoices.value = false
}
</script>

<template>
  <div v-if="showCompleteChoices" class="sfm-quest-panel">
    <p>What do you want to do with this quest?</p>
    <div class="sfm-quest-panel__actions">
      <button data-test="complete-erase" @click="erase">Erase</button>
      <button data-test="complete-recurring" @click="convertTo('recurring_quest')">Keep as Recurring Quest</button>
      <button data-test="complete-memory" @click="convertTo('memory')">Keep as Memory</button>
      <button data-test="complete-cancel" @click="showCompleteChoices = false">Cancel</button>
    </div>
  </div>
  <div v-else class="sfm-quest-panel">
    <button data-test="close" class="sfm-quest-panel__close" @click="emit('close')">&times;</button>
    <h3>{{ quest.title }}</h3>
    <p>{{ quest.description }}</p>
    <p v-if="quest.type === 'quest'">{{ quest.category }} &middot; {{ quest.starts_at }}</p>
    <p v-else>{{ quest.category }}</p>
    <div class="sfm-quest-panel__actions">
      <button data-test="edit" @click="emit('edit', quest)">Edit</button>
      <button data-test="delete" @click="emit('delete', quest.id)">Delete</button>
      <button v-if="quest.type === 'quest'" data-test="complete" @click="showCompleteChoices = true">
        Complete
      </button>
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
