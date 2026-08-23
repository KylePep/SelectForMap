<!-- frontend/src/components/PinTypePicker.vue -->
<script setup>
const emit = defineEmits(['select', 'cancel'])
</script>

<template>
  <div class="sfm-pin-type-picker">
    <button data-test="type-quest" type="button" @click="emit('select', 'quest')">Quest</button>
    <button data-test="type-recurring_quest" type="button" @click="emit('select', 'recurring_quest')">
      Recurring Quest
    </button>
    <button data-test="type-memory" type="button" @click="emit('select', 'memory')">Memory</button>
    <button data-test="cancel" type="button" @click="emit('cancel')">Cancel</button>
  </div>
</template>

<style scoped>
.sfm-pin-type-picker {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 2px solid var(--sfm-panel-border);
  background: var(--sfm-panel-bg);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}
</style>
