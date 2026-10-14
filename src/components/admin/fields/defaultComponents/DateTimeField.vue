<script setup lang="ts">
import { computed } from "vue"

import { inputToIso, isoToInputDateTime } from "./dateInput"

import type { FieldDescriptor } from "../types"

defineProps<{ field: FieldDescriptor }>()
const model = defineModel<string | undefined>()

const FIELD_CLASS =
  "w-full rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-3 py-2 text-sm text-[var(--ch-admin-text)] transition-colors outline-none focus:border-[var(--ch-admin-accent)]"

const inputValue = computed({
  get: () => isoToInputDateTime(model.value),
  set: (value: string) => {
    model.value = inputToIso(value)
  },
})
</script>

<template>
  <input v-model="inputValue" :class="FIELD_CLASS" type="datetime-local" />
</template>
