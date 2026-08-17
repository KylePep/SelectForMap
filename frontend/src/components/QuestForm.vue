<!-- frontend/src/components/QuestForm.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
})
const emit = defineEmits(['submit', 'cancel'])

const title = ref('')
const description = ref('')
const category = ref('food')
const startsAt = ref('')

function submit() {
  if (!title.value.trim()) return

  emit('submit', {
    title: title.value,
    description: description.value,
    category: category.value,
    lat: props.lat,
    lng: props.lng,
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
    <button type="submit">Create quest</button>
    <button type="button" @click="emit('cancel')">Cancel</button>
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
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}
</style>
