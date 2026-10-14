<script setup lang="ts">
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { computed, onMounted } from "vue"

import { useAdminPanelDetailStore } from "../../stores/adminPanel/detail"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import { resolveEntityConfig } from "../../stores/adminPanel/instance"
import MainLoader from "../MainLoader.vue"

import { detailConfigToPanelConfig } from "./config"
import FieldGroupRenderer from "./FieldGroupRenderer.vue"
import { isRecordValue } from "./rawValue"
import RawValue from "./RawValue.vue"
import RecordEntry from "./RecordEntry.vue"
import { getRecordId } from "./recordId"

import type { AdminDetailConfig, AdminPanelConfig } from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  /** Embedded-detail config fragment (used when `config` is not passed). */
  detailConfig?: AdminDetailConfig
  entity?: ParsedEntity
  instanceKey?: string
  record?: Record<string, unknown>
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "close") => void>()

const adminPanelStore = useAdminPanelStore()

const store = useAdminPanelDetailStore({
  baseUrl: properties.baseUrl,
  config: properties.config,
  entity: () => properties.entity,
  instanceKey: properties.instanceKey ?? "admin-1",
})

const { detailRecord, detailStatus, hasDetailEndpoint, viewingRecord } =
  storeToRefs(store)
const { closeView, loadRecordDetail, patchRecord, startView } = store

const currentEntity = computed(
  () => properties.entity ?? adminPanelStore.activeEntity,
)
const instanceConfig = computed(
  () =>
    properties.config ??
    (properties.detailConfig === undefined
      ? undefined
      : detailConfigToPanelConfig(
          properties.detailConfig,
          currentEntity.value?.entityName,
        )) ??
    adminPanelStore.config,
)
const entityConfig = computed(() =>
  resolveEntityConfig(instanceConfig.value, currentEntity.value),
)
const detailOverride = computed(() => entityConfig.value?.detailOverride)
const customDetail = computed(() => instanceConfig.value?.views?.detail)

const displayRecord = computed(
  () => detailRecord.value ?? viewingRecord.value ?? properties.record,
)

const recordId = computed(() => {
  const record = displayRecord.value
  if (!isRecordValue(record)) return undefined
  const id = getRecordId(record)
  return id === undefined ? undefined : String(id)
})

const groupValue = computed<Record<string, unknown>>(() =>
  isRecordValue(displayRecord.value) ? displayRecord.value : {},
)

const hiddenKeys = computed(
  () => new Set<string>(detailOverride.value?.hiddenFields),
)

const entries = computed(() =>
  isRecordValue(displayRecord.value)
    ? Object.entries(displayRecord.value).filter(
        ([key]) => !hiddenKeys.value.has(key),
      )
    : [],
)

function handleGroupChange(changed: Record<string, unknown>) {
  patchRecord(changed)
}

function handleClose() {
  closeView()
  emit("close")
}

onMounted(() => {
  if (viewingRecord.value === undefined && properties.record !== undefined) {
    startView(properties.record)
  }
})
</script>

<template>
  <component
    :is="customDetail"
    v-if="customDetail"
    :close="handleClose"
    :has-detail-endpoint="hasDetailEndpoint"
    :record="displayRecord"
    :reload="loadRecordDetail"
    :status="detailStatus"
  />

  <div v-else class="w-full space-y-4">
    <div class="flex items-center justify-between gap-3">
      <button
        class="rounded border border-[var(--ch-admin-border)] px-3 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:text-[var(--ch-admin-text)]"
        @click="handleClose"
      >
        &larr; Back to list
      </button>
      <div class="text-right">
        <h2 class="text-sm font-semibold text-[var(--ch-admin-text)]">
          {{ currentEntity?.entityName ?? "record" }}
          <span v-if="recordId !== undefined">#{{ recordId }}</span>
        </h2>
        <p class="text-xs text-[var(--ch-admin-text-muted)]">
          {{ currentEntity?.fullBasePath }}
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

        <FieldGroupRenderer
          v-if="detailOverride"
          :override="detailOverride"
          :value="groupValue"
          :on-change="handleGroupChange"
        />
      </template>
    </div>
  </div>
</template>
