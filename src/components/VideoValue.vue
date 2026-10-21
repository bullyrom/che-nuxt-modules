<script setup lang="ts">
import FieldLabel from "./FieldLabel.vue"

interface Properties {
  /** Optional field heading rendered above the player. */
  heading?: string
  src?: string
}

const properties = defineProps<Properties>()
</script>

<template>
  <div v-if="properties.src" class="space-y-2">
    <FieldLabel v-if="properties.heading" :label="properties.heading" />
    <video
      :src="properties.src"
      class="max-w-full rounded border border-[var(--ch-admin-border,#d1d5db)]"
      controls
      preload="none"
    />
  </div>
</template>
