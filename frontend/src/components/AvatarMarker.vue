<!-- frontend/src/components/AvatarMarker.vue -->
<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import maplibregl from 'maplibre-gl'

const props = defineProps({
  map: { type: Object, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  clickable: { type: Boolean, default: false },
})
const emit = defineEmits(['home-requested'])

let marker = null
let markerEl = null

function onClick(event) {
  event.stopPropagation()
  emit('home-requested')
}

// Applied both at creation and whenever the `clickable` prop changes later, since
// this marker stays mounted across a home base being set mid-session.
function applyClickable(clickable) {
  if (!markerEl) return
  markerEl.style.cursor = clickable ? 'pointer' : ''
  markerEl.removeEventListener('click', onClick)
  if (clickable) markerEl.addEventListener('click', onClick)
}

function render() {
  const el = document.createElement('div')
  markerEl = el
  el.className = 'sfm-avatar-marker'
  el.style.width = '32px'
  el.style.height = '32px'
  el.style.backgroundImage = 'url(/sprites/avatar-default.png)'
  el.style.backgroundSize = 'contain'
  el.style.backgroundRepeat = 'no-repeat'
  el.style.backgroundPosition = 'center'
  // Visible fallback for when the avatar sprite has not been added yet, so the
  // player's position is never an invisible/transparent div.
  el.style.backgroundColor = '#1098ad'
  el.style.borderRadius = '50%'
  el.style.border = '3px solid #ffffff'
  el.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.35)'
  applyClickable(props.clickable)

  marker = new maplibregl.Marker({ element: el })
    .setLngLat([props.lng, props.lat])
    .addTo(props.map)
}

onMounted(render)
onBeforeUnmount(() => marker?.remove())

watch(() => [props.lat, props.lng], () => {
  marker?.setLngLat([props.lng, props.lat])
})

watch(() => props.clickable, (clickable) => applyClickable(clickable))
</script>

<template></template>
