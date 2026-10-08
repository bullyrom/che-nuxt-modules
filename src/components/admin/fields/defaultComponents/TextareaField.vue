<script setup lang="ts">
import type { FieldDescriptor } from "../types"

defineProps<{ field: FieldDescriptor }>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <textarea
    v-model="model"
    class="w-full rounded-[var(--ch-admin-radius-sm)] border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-3 py-2 text-sm text-[var(--ch-admin-text)] transition-colors outline-none placeholder:text-[var(--ch-admin-text-muted)] focus:border-[var(--ch-admin-accent)]"
    rows="3"
  />
</template>
