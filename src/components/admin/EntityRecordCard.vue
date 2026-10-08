<script setup lang="ts">
import { isRecordValue } from "./rawValue"
import RawValue from "./RawValue.vue"
import RecordEntry from "./RecordEntry.vue"

interface Properties {
  index: number
  item: unknown
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "delete" | "edit", item: unknown) => void>()

function getObjectKeys(value: unknown): string[] {
  return isRecordValue(value) ? Object.keys(value) : []
}

function getObjectValue(value: unknown, key: string): unknown {
  return isRecordValue(value) ? value[key] : undefined
}

function getRecordId(record: unknown): unknown {
  if (!isRecordValue(record)) return undefined
  return record.id ?? record.pk
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
    <RawValue
      v-if="!isRecordValue(properties.item)"
      :value="properties.item"
    />
    <div v-else class="space-y-2">
      <RecordEntry
        v-for="key in getObjectKeys(properties.item)"
        :key="key"
        :field-key="key"
        :value="getObjectValue(properties.item, key)"
      />
    </div>
  </div>
</template>
