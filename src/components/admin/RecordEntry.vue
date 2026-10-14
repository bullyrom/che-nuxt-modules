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
  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map((item, index): Entry => [String(index), item])
      : undefined
  }
  if (isRecordValue(value)) {
    const entries = Object.entries(value)
    return entries.length > 0 ? entries : undefined
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
  const count = nestedEntries.value?.length ?? 0
  if (Array.isArray(properties.value)) return `${count} items`
  const identifier = readIdentifier(properties.value)
  return identifier ? `${count} fields · ${identifier}` : `${count} fields`
})
</script>

<template>
  <div
    v-if="nestedEntries"
    class="overflow-hidden rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)]"
  >
    <RollDown
      :title="properties.fieldKey"
      :button-classes="buttonClasses"
      :unmount-on-close="true"
    >
      <template #button-content="{ open }">
        <span class="flex min-w-0 items-center gap-2">
          <span class="text-[var(--ch-admin-text-muted)]">{{
            open ? "▾" : "▸"
          }}</span>
          <span
            class="truncate font-mono text-xs text-[var(--ch-admin-text)]"
            v-text="properties.fieldKey"
          />
        </span>
        <span
          class="ml-auto shrink-0 text-xs text-[var(--ch-admin-text-muted)]"
        >
          {{ summary }}
        </span>
      </template>
      <div
        class="ml-2 space-y-2 border-t border-l border-[var(--ch-admin-border)] py-2 pl-3"
      >
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
