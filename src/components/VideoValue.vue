<script setup lang="ts">
interface Properties {
  src?: string
}

const properties = defineProps<Properties>()
</script>

<template>
  <video
    v-if="properties.src"
    :src="properties.src"
    class="max-w-full rounded border border-[var(--ch-admin-border,#d1d5db)]"
    controls
    preload="none"
  />
</template>
