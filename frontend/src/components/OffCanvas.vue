<!-- frontend/src/components/OffCanvas.vue -->
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
  <div
    v-if="modelValue"
    class="sfm-offcanvas-backdrop"
    data-test="offcanvas-backdrop"
    @click.self="close"
  >
    <div class="sfm-offcanvas-panel">
      <button
        type="button"
        class="sfm-offcanvas-panel__close"
        data-test="offcanvas-close"
        aria-label="Close"
        @click="close"
      >
        &times;
      </button>
      <h2 v-if="title" class="sfm-offcanvas-panel__title">{{ title }}</h2>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sfm-offcanvas-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);
}

.sfm-offcanvas-panel {
  position: relative;
  height: 100%;
  width: min(20rem, 85vw);
  overflow: auto;
  padding: 1.5rem;
  background: var(--sfm-panel-bg);
  color: var(--sfm-panel-text);
  border-right: 2px solid var(--sfm-panel-border);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.25);
  animation: sfm-offcanvas-slide-in 0.2s ease-out;
}

@keyframes sfm-offcanvas-slide-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.sfm-offcanvas-panel__title {
  margin-bottom: 0.75rem;
  padding-right: 1.75rem;
}

.sfm-offcanvas-panel__close {
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

.sfm-offcanvas-panel__close:hover {
  color: var(--sfm-danger);
}
</style>
