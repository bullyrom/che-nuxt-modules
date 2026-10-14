<script setup lang="ts">
interface Properties {
  src?: string
}

const properties = defineProps<Properties>()
</script>

<template>
  <audio
    v-if="properties.src"
    :src="properties.src"
    class="w-full"
    controls
    preload="none"
  />
</template>
