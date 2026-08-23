<!-- frontend/src/components/HomeMarker.vue -->
<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import maplibregl from 'maplibre-gl'

const props = defineProps({
  map: { type: Object, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
})

let marker = null

function render() {
  const el = document.createElement('div')
  el.className = 'sfm-home-marker'
  el.style.width = '32px'
  el.style.height = '32px'
  el.style.backgroundImage = 'url(/sprites/home-marker.png)'
  el.style.backgroundSize = 'contain'
  el.style.backgroundRepeat = 'no-repeat'
  el.style.backgroundPosition = 'center'
  // Visible fallback for when the home-base sprite has not been added yet, so the
  // marker is never an invisible/transparent div. Orange + rounded-square, rather
  // than the avatar's blue circle, so the two are never confused at a glance.
  el.style.backgroundColor = '#f08c00'
  el.style.borderRadius = '6px'
  el.style.border = '3px solid #ffffff'
  el.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.35)'

  marker = new maplibregl.Marker({ element: el })
    .setLngLat([props.lng, props.lat])
    .addTo(props.map)
}

onMounted(render)
onBeforeUnmount(() => marker?.remove())

watch(() => [props.lat, props.lng], () => {
  marker?.setLngLat([props.lng, props.lat])
})
</script>

<template></template>
