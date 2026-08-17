<!-- frontend/src/components/AvatarMarker.vue -->
<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import mapboxgl from 'mapbox-gl'

const props = defineProps({
  map: { type: Object, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
})

let marker = null

function render() {
  const el = document.createElement('div')
  el.className = 'sfm-avatar-marker'
  el.style.width = '32px'
  el.style.height = '32px'
  el.style.backgroundImage = 'url(/sprites/avatar-default.png)'
  el.style.backgroundSize = 'contain'

  marker = new mapboxgl.Marker({ element: el })
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
