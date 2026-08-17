<!-- frontend/src/components/QuestPanel.vue -->
<script setup>
const props = defineProps({ quest: { type: Object, required: true } })
const emit = defineEmits(['close', 'delete'])
</script>

<template>
  <div class="sfm-quest-panel">
    <button data-test="close" @click="emit('close')">&times;</button>
    <h3>{{ quest.title }}</h3>
    <p>{{ quest.description }}</p>
    <p>{{ quest.category }} &middot; {{ quest.starts_at }}</p>
    <button data-test="delete" @click="emit('delete', quest.id)">Delete</button>
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
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}
</style>
