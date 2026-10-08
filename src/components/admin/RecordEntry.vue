<script setup lang="ts">
import { computed } from "vue"

import RollDown from "../RollDown.vue"

import FieldValue from "./FieldValue.vue"
import { isRecordValue } from "./rawValue"

type Entry = [string, unknown]

interface Properties {
  fieldKey: string
  nested?: boolean
  value: unknown
}

const properties = defineProps<Properties>()

const IDENTIFIER_KEYS = ["id", "pk", "name", "title", "slug"]
const NESTED_PADDING = "px-1.5"

const nestedEntries = computed<Entry[] | undefined>(() => {
  const { value } = properties
  if (isRecordValue(value)) return Object.entries(value)
  if (Array.isArray(value)) {
    return value.map((item, index): Entry => [String(index), item])
  }
  return undefined
})

const buttonClasses = computed(() => {
  const base =
    "flex w-full items-center gap-2 py-1.5 text-left text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
  return properties.nested
    ? `${base} ${NESTED_PADDING}`
    : `${base} bg-transparent`
})

const rowClasses = computed(() =>
  properties.nested
    ? `flex items-start gap-2 ${NESTED_PADDING}`
    : "flex items-start gap-2",
)

function isPrimitive(value: unknown): boolean {
  return typeof value === "string" || typeof value === "number"
}

function readIdentifier(value: unknown): string | undefined {
  if (!isRecordValue(value)) return undefined
  for (const key of IDENTIFIER_KEYS) {
    const candidate = value[key]
    if (isPrimitive(candidate)) return `${key} ${String(candidate)}`
  }
  const scalar = Object.entries(value).find(([, candidate]) =>
    isPrimitive(candidate),
  )
  return scalar ? `${scalar[0]} ${String(scalar[1])}` : undefined
}

const summary = computed(() => {
  if (Array.isArray(properties.value)) {
    return `массив ${properties.value.length}`
  }
  const identifier = readIdentifier(properties.value)
  return identifier ? `объект ${identifier}` : "объект"
})
</script>

<template>
  <div
    v-if="nestedEntries"
    class="overflow-hidden rounded border border-[var(--ch-admin-border)]"
  >
    <RollDown
      :title="properties.fieldKey"
      :button-classes="buttonClasses"
      :unmount-on-close="true"
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
      <div class="space-y-2 border-t border-[var(--ch-admin-border)] py-2">
        <RecordEntry
          v-for="[childKey, childValue] in nestedEntries"
          :key="childKey"
          :field-key="childKey"
          :nested="true"
          :value="childValue"
        />
      </div>
    </RollDown>
  </div>

  <div v-else :class="rowClasses">
    <span
      class="mt-0.5 shrink-0 rounded bg-[var(--ch-admin-bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--ch-admin-text-muted)]"
    >
      {{ properties.fieldKey }}
    </span>
    <FieldValue :value="properties.value" />
  </div>
</template>
