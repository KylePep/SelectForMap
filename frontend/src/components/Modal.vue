<!-- frontend/src/components/Modal.vue -->
<script setup>
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

// Only listen while open, so background modals/pages can't be closed by a
// stray Escape press from an unrelated part of the app.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      window.addEventListener('keydown', onKeydown)
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    data-test="modal-backdrop" @click.self="close">
    <div class="sfm-modal-content">
      <button type="button" class="sfm-modal-content__close" data-test="modal-close" aria-label="Close" @click="close">
        &times;
      </button>
      <h2 v-if="title" class="sfm-modal-content__title">{{ title }}</h2>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sfm-modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 22rem;
  padding: 1.5rem;
  border: 2px solid var(--sfm-panel-border);
  border-radius: 10px;
  background: var(--sfm-panel-bg);
  color: var(--sfm-panel-text);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.sfm-modal-content__title {
  margin-bottom: 0.75rem;
  text-align: center;
}

.sfm-modal-content__close {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  z-index: 1;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: transparent;
  color: var(--sfm-panel-text);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.sfm-modal-content__close:hover {
  color: var(--sfm-danger);
}
</style>
