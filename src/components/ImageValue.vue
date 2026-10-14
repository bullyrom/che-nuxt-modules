<script setup lang="ts">
interface Properties {
  alt?: string
  href?: string
  src?: string
}

const properties = defineProps<Properties>()
</script>

<template>
  <a
    v-if="properties.src"
    class="group relative inline-block text-[var(--ch-admin-accent,#3b5cf6)] underline"
    :href="properties.href ?? properties.src"
    rel="noopener noreferrer"
    target="_blank"
  >
    {{ properties.alt ?? properties.src }}
    <span
      class="pointer-events-none absolute top-full left-0 z-30 mt-1 hidden group-hover:block"
    >
      <img
        :alt="properties.alt ?? ''"
        class="max-h-[16rem] max-w-[16rem] rounded border border-[var(--ch-admin-border,#d1d5db)] bg-[var(--ch-admin-surface,#fff)] object-contain shadow-lg"
        :src="properties.src"
      />
    </span>
  </a>
</template>
