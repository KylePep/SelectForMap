<script setup>
import MapCanvas from '../components/MapCanvas.vue'

function onMapReady(map) {
  console.log('Map ready', map)
}
</script>

<template>
  <MapCanvas @map-ready="onMapReady" />
</template>
