<script setup lang="ts">
import { computed } from "vue"

import FieldGroupRenderer from "./FieldGroupRenderer.vue"
import { isRecordValue } from "./rawValue"
import RawValue from "./RawValue.vue"
import RecordEntry from "./RecordEntry.vue"

import type { FieldGroupOverride } from "./fields/types"

interface Properties {
  hiddenFields?: string[]
  index: number
  item: unknown
  onChange?: (changed: Record<string, unknown>) => void
  override?: FieldGroupOverride
  /** Whether the detail action is offered at all. */
  showView?: boolean
  /** When set, the detail action is a link; otherwise an in-place `view`. */
  viewHref?: string
}

const properties = defineProps<Properties>()
const emit =
  defineEmits<(event: "delete" | "edit" | "view", item: unknown) => void>()

const recordItem = computed(() =>
  isRecordValue(properties.item) ? properties.item : undefined,
)

const hiddenKeys = computed(() => new Set(properties.hiddenFields))

function getObjectKeys(value: unknown): string[] {
  if (!isRecordValue(value)) return []
  return Object.keys(value).filter((key) => !hiddenKeys.value.has(key))
}

function getObjectValue(value: unknown, key: string): unknown {
  return isRecordValue(value) ? value[key] : undefined
}

function getRecordId(record: unknown): unknown {
  if (!isRecordValue(record)) return undefined
  return record.id ?? record.pk
}

function handleGroupChange(changed: Record<string, unknown>) {
  properties.onChange?.(changed)
}
</script>

<template>
  <div
    class="rounded-xl border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] p-4 shadow-sm transition-shadow hover:shadow-md"
  >
    <div class="mb-2 flex items-center justify-between">
      <span class="text-xs font-medium text-[var(--ch-admin-text-muted)]"
        >#{{ properties.index + 1 }}</span
      >
      <div class="flex items-center gap-1">
        <a
          v-if="properties.showView !== false && properties.viewHref"
          class="rounded px-2 py-0.5 text-xs text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)] hover:text-[var(--ch-admin-text)]"
          :href="properties.viewHref"
          title="View"
        >
          View
        </a>
        <button
          v-else-if="properties.showView !== false"
          class="rounded px-2 py-0.5 text-xs text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)] hover:text-[var(--ch-admin-text)]"
          title="View"
          @click="emit('view', properties.item)"
        >
          View
        </button>
        <button
          class="rounded px-2 py-0.5 text-xs text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)] hover:text-[var(--ch-admin-text)]"
          title="Edit"
          @click="emit('edit', properties.item)"
        >
          ✎
        </button>
        <button
          class="rounded px-2 py-0.5 text-xs text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-danger-bg)] hover:text-[var(--ch-admin-danger-text)]"
          title="Delete"
          @click="emit('delete', properties.item)"
        >
          ✕
        </button>
      </div>
      <span
        v-if="getRecordId(properties.item) !== undefined"
        class="rounded bg-[var(--ch-admin-bg)] px-2 py-0.5 font-mono text-xs text-[var(--ch-admin-text-muted)]"
      >
        ID: {{ getRecordId(properties.item) }}
      </span>
    </div>
    <RawValue v-if="!recordItem" :value="properties.item" />
    <div v-else class="space-y-2">
      <RecordEntry
        v-for="key in getObjectKeys(properties.item)"
        :key="key"
        :field-key="key"
        :value="getObjectValue(properties.item, key)"
      />

      <FieldGroupRenderer
        v-if="properties.override"
        :override="properties.override"
        :value="recordItem ?? {}"
        :on-change="handleGroupChange"
      />
    </div>
  </div>
</template>
