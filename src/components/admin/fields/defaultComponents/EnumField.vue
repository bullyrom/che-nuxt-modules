<script setup lang="ts">
import type { FieldDescriptor } from "../types"

const properties = defineProps<{ field: FieldDescriptor }>()

const model = defineModel<unknown>()

const EMPTY_OPTION_LABEL = "—"
</script>

<template>
  <select
    v-model="model"
    class="w-full rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-3 py-2 text-sm text-[var(--ch-admin-text)] transition-colors outline-none focus:border-[var(--ch-admin-accent)]"
  >
    <option :value="undefined">{{ EMPTY_OPTION_LABEL }}</option>
    <option
      v-for="option in properties.field.schema?.enum ?? []"
      :key="String(option)"
      :value="option"
    >
      {{ String(option) }}
    </option>
  </select>
</template>
