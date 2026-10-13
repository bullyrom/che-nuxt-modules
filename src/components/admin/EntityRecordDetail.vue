<script setup lang="ts">
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { computed, inject, onMounted } from "vue"

import {
  ADMIN_ENTITY_STORE,
  useAdminPanelEntityStore,
} from "../../stores/adminPanel/entity"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import MainLoader from "../MainLoader.vue"

import { isRecordValue } from "./rawValue"
import RawValue from "./RawValue.vue"
import RecordEntry from "./RecordEntry.vue"
import { getRecordId } from "./recordId"

import type { AdminPanelConfig } from "./fields/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  record?: Record<string, unknown>
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "close") => void>()

const adminPanelStore = useAdminPanelStore()

const injectedStore = inject(ADMIN_ENTITY_STORE, undefined)
const store =
  injectedStore ??
  useAdminPanelEntityStore({
    baseUrl: properties.baseUrl,
    config: properties.config,
    entityPath: adminPanelStore.activeEntity?.fullBasePath ?? "none",
  })

const { detailRecord, detailStatus, hasDetailEndpoint, viewingRecord } =
  storeToRefs(store)

const displayRecord = computed(
  () => detailRecord.value ?? viewingRecord.value ?? properties.record,
)

const recordId = computed(() => {
  const record = displayRecord.value
  if (!isRecordValue(record)) return undefined
  const id = getRecordId(record)
  return id === undefined ? undefined : String(id)
})

const entries = computed(() =>
  isRecordValue(displayRecord.value)
    ? Object.entries(displayRecord.value)
    : [],
)

onMounted(() => {
  if (viewingRecord.value === undefined && properties.record !== undefined) {
    store.startView(properties.record)
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <button
        class="rounded border border-[var(--ch-admin-border)] px-3 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:text-[var(--ch-admin-text)]"
        @click="emit('close')"
      >
        &larr; Back to list
      </button>
      <div class="text-right">
        <h2 class="text-sm font-semibold text-[var(--ch-admin-text)]">
          {{ adminPanelStore.activeEntity?.entityName ?? "record" }}
          <span v-if="recordId !== undefined">#{{ recordId }}</span>
        </h2>
        <p class="text-xs text-[var(--ch-admin-text-muted)]">
          {{ adminPanelStore.activeEntity?.fullBasePath }}
        </p>
      </div>
    </div>

    <div
      v-if="
        detailStatus === 'pending' ||
        (hasDetailEndpoint && detailStatus === 'idle')
      "
      class="flex h-64 items-center justify-center"
    >
      <MainLoader :wh="40" />
    </div>

    <div
      v-else-if="detailStatus === 'error'"
      class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-danger-text)]"
    >
      Failed to load record
    </div>

    <div
      v-else
      class="space-y-2 rounded-xl border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] p-4"
    >
      <RawValue v-if="entries.length === 0" :value="displayRecord" />
      <template v-else>
        <RecordEntry
          v-for="[key, value] in entries"
          :key="key"
          :field-key="key"
          :value="value"
        />
      </template>
    </div>
  </div>
</template>
