<script setup lang="ts">
import { computed } from "vue"

import RollDown from "../RollDown.vue"

import FieldValue from "./FieldValue.vue"
import { isRecordValue } from "./rawValue"

type Entry = [string, unknown]

interface Properties {
  fieldKey: string
  value: unknown
}

const properties = defineProps<Properties>()

const nestedEntries = computed<Entry[] | undefined>(() => {
  const { value } = properties
  if (isRecordValue(value)) return Object.entries(value)
  if (Array.isArray(value)) {
    return value.map((item, index): Entry => [String(index), item])
  }
  return undefined
})

const summary = computed(() => {
  const count = nestedEntries.value?.length ?? 0
  return Array.isArray(properties.value) ? `${count} items` : `${count} fields`
})
</script>

<template>
  <div
    v-if="nestedEntries"
    class="overflow-hidden rounded border border-[var(--ch-admin-border)]"
  >
    <RollDown
      :title="properties.fieldKey"
      button-classes="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
    >
      <template #button-content="{ open }">
        <span class="text-[var(--ch-admin-text-muted)]">{{
          open ? "▾" : "▸"
        }}</span>
        <span class="font-mono text-xs text-[var(--ch-admin-text)]">{{
          properties.fieldKey
        }}</span>
        <span class="text-xs text-[var(--ch-admin-text-muted)]">{{
          summary
        }}</span>
      </template>
      <div class="space-y-1 border-t border-[var(--ch-admin-border)] py-1">
        <RecordEntry
          v-for="[childKey, childValue] in nestedEntries"
          :key="childKey"
          :field-key="childKey"
          :value="childValue"
        />
      </div>
    </RollDown>
  </div>

  <div v-else class="flex items-start gap-2 px-3 py-1.5">
    <span
      class="mt-0.5 shrink-0 rounded bg-[var(--ch-admin-bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--ch-admin-text-muted)]"
    >
      {{ properties.fieldKey }}
    </span>
    <FieldValue :value="properties.value" />
  </div>
</template>
