<!-- frontend/src/components/QuestForm.vue -->
<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  // Coordinates for a brand new quest (the dropped pin). Optional when editing,
  // because an existing quest already carries its own lat/lng.
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  // When present the form acts as an edit form, pre-filled from this quest.
  quest: { type: Object, default: null },
})
const emit = defineEmits(['submit', 'cancel'])

const title = ref('')
const description = ref('')
const category = ref('food')
const startsAt = ref('')

const isEdit = computed(() => !!props.quest)
const submitLabel = computed(() => (isEdit.value ? 'Save quest' : 'Create quest'))
const latValue = computed(() => (props.quest ? props.quest.lat : props.lat))
const lngValue = computed(() => (props.quest ? props.quest.lng : props.lng))

/**
 * The API returns `starts_at` as an ISO-8601 string ("2026-09-01T18:00:00+00:00")
 * while `<input type="datetime-local">` needs "YYYY-MM-DDTHH:mm". Slicing (rather
 * than going through `Date`) keeps the wall-clock value the user originally typed,
 * matching how the create flow submits it.
 */
function toDateTimeLocal(value) {
  if (!value) return ''
  return String(value).replace(' ', 'T').slice(0, 16)
}

watch(
  () => props.quest,
  (quest) => {
    title.value = quest?.title ?? ''
    description.value = quest?.description ?? ''
    category.value = quest?.category ?? 'food'
    startsAt.value = toDateTimeLocal(quest?.starts_at)
  },
  { immediate: true },
)

function submit() {
  if (!title.value.trim()) return

  emit('submit', {
    title: title.value,
    description: description.value,
    category: category.value,
    lat: latValue.value,
    lng: lngValue.value,
    starts_at: startsAt.value,
  })
}
</script>

<template>
  <form class="sfm-quest-form" @submit.prevent="submit">
    <input data-test="title" v-model="title" placeholder="Quest title" required />
    <textarea data-test="description" v-model="description" placeholder="Description"></textarea>
    <select data-test="category" v-model="category">
      <option value="food">Food</option>
      <option value="movie">Movie</option>
      <option value="outdoors">Outdoors</option>
      <option value="nightlife">Nightlife</option>
      <option value="shopping">Shopping</option>
      <option value="other">Other</option>
    </select>
    <input data-test="starts_at" v-model="startsAt" type="datetime-local" required />
    <button data-test="submit" type="submit">{{ submitLabel }}</button>
    <button data-test="cancel" type="button" @click="emit('cancel')">Cancel</button>
  </form>
</template>

<style scoped>
.sfm-quest-form {
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
