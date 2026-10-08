<template>
  <div
    class="flex items-center justify-center"
    :class="wh > 100 ? 'h-[60vh]' : ''"
  >
    <svg
      :width="wh"
      :height="wh"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      class="animate-spin"
      fill="none"
    >
      <circle
        class="stroke-[var(--ch-admin-accent,#2563eb)]"
        cx="50"
        cy="50"
        r="40"
        stroke-width="4"
        stroke-dasharray="150 50"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Properties {
  wh?: number
}

withDefaults(defineProps<Properties>(), {
  wh: 100,
})
</script>
