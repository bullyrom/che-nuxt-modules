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
const ROOT_PADDING = "px-3"
const NESTED_PADDING = "px-1.5"
const HEADER_BASE =
  "flex w-full items-center gap-2 py-1.5 text-left text-[var(--ch-admin-text)]"

const collectionEntries = computed<Entry[] | undefined>(() => {
  const { value } = properties
  if (Array.isArray(value)) {
    return value.map((item, index): Entry => [String(index), item])
  }
  if (isRecordValue(value)) return Object.entries(value)
  return undefined
})

const nestedEntries = computed<Entry[] | undefined>(() => {
  const entries = collectionEntries.value
  return entries !== undefined && entries.length > 0 ? entries : undefined
})

// Collections with no children keep the card look but are not expandable.
const isEmptyCollection = computed(
  () =>
    collectionEntries.value !== undefined && nestedEntries.value === undefined,
)

const headerClasses = computed(
  () => `${HEADER_BASE} ${properties.nested ? NESTED_PADDING : ROOT_PADDING}`,
)

const buttonClasses = computed(
  () =>
    `${headerClasses.value} bg-transparent transition-colors hover:bg-[var(--ch-admin-surface-hover)]`,
)

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
  const count = collectionEntries.value?.length ?? 0
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

  <div
    v-else-if="isEmptyCollection"
    class="overflow-hidden rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)]"
  >
    <div :class="headerClasses">
      <span class="flex min-w-0 items-center gap-2">
        <span class="text-[var(--ch-admin-text-muted)]">▸</span>
        <span
          class="truncate font-mono text-xs text-[var(--ch-admin-text)]"
          v-text="properties.fieldKey"
        />
      </span>
      <span class="ml-auto shrink-0 text-xs text-[var(--ch-admin-text-muted)]">
        {{ summary }}
      </span>
    </div>
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
