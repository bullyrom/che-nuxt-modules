<script setup lang="ts">
interface Properties {
  /** Text shown above a field control. */
  label: string
}

const properties = defineProps<Properties>()

const FIELD_LABEL_CLASSES =
  "mb-1 block text-xs font-medium tracking-wider text-[var(--ch-admin-text-muted,#6b7280)] uppercase"
</script>

<template>
  <label :class="FIELD_LABEL_CLASSES">{{ properties.label }}</label>
</template>
