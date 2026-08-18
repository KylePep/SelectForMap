<!-- frontend/src/components/QuestMarker.vue -->
<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import { iconForCategory, colorForCategory } from '../utils/categoryIcons'

const props = defineProps({
  map: { type: Object, required: true },
  quest: { type: Object, required: true },
})
const emit = defineEmits(['select'])

let marker = null
let element = null

function applyCategoryStyles(el, category) {
  el.style.backgroundImage = `url(${iconForCategory(category)})`
  // Colored disc fallback: if the sprite is missing the marker is still a visible,
  // clickable target rather than a transparent div.
  el.style.backgroundColor = colorForCategory(category)
}

onMounted(() => {
  const el = document.createElement('div')
  element = el
  el.className = 'sfm-quest-marker'
  el.style.width = '28px'
  el.style.height = '28px'
  el.style.borderRadius = '50%'
  el.style.border = '2px solid #ffffff'
  el.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.35)'
  el.style.backgroundSize = 'contain'
  el.style.backgroundRepeat = 'no-repeat'
  el.style.backgroundPosition = 'center'
  el.style.cursor = 'pointer'
  applyCategoryStyles(el, props.quest.category)

  // Marker clicks do not stop propagation by default, so without this the same
  // click would also reach the map's own click handler and open the "new quest" form on top.
  el.addEventListener('click', (event) => {
    event.stopPropagation()
    emit('select', props.quest)
  })

  marker = new maplibregl.Marker({ element: el })
    .setLngLat([props.quest.lng, props.quest.lat])
    .addTo(props.map)
})

onBeforeUnmount(() => marker?.remove())

// An edit replaces the quest object in place (same id, so the v-for keeps this
// component), so the marker has to follow the new coordinates/category.
watch(
  () => [props.quest.lng, props.quest.lat],
  () => marker?.setLngLat([props.quest.lng, props.quest.lat]),
)

watch(
  () => props.quest.category,
  (category) => {
    if (element) applyCategoryStyles(element, category)
  },
)
</script>

<template></template>
