<!-- frontend/src/components/QuestMarker.vue -->
<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import mapboxgl from 'mapbox-gl'
import { iconForCategory } from '../utils/categoryIcons'

const props = defineProps({
  map: { type: Object, required: true },
  quest: { type: Object, required: true },
})
const emit = defineEmits(['select'])

let marker = null

onMounted(() => {
  const el = document.createElement('div')
  el.className = 'sfm-quest-marker'
  el.style.width = '28px'
  el.style.height = '28px'
  el.style.backgroundImage = `url(${iconForCategory(props.quest.category)})`
  el.style.backgroundSize = 'contain'
  el.style.cursor = 'pointer'
  el.addEventListener('click', () => emit('select', props.quest))

  marker = new mapboxgl.Marker({ element: el })
    .setLngLat([props.quest.lng, props.quest.lat])
    .addTo(props.map)
})

onBeforeUnmount(() => marker?.remove())
</script>

<template></template>
