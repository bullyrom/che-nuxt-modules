<script setup lang="ts">
import { computed, onMounted } from "vue"

import { useDetailApi } from "../../composables/api"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import MainLoader from "../MainLoader.vue"

import { buildEntityDetailUrl, hasEntityDetailEndpoint } from "./entityDetail"
import { isRecordValue } from "./rawValue"
import RawValue from "./RawValue.vue"
import RecordEntry from "./RecordEntry.vue"

interface Properties {
  baseUrl: string
  record: Record<string, unknown>
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "close") => void>()

const adminPanelStore = useAdminPanelStore()

const {
  data: detailRecord,
  fetchData: fetchDetail,
  fetchDataStatus,
} = useDetailApi<unknown>()

const recordId = computed(() => {
  const candidate = properties.record.id ?? properties.record.pk
  return candidate === undefined ? undefined : String(candidate)
})

const canFetchDetail = computed(
  () =>
    recordId.value !== undefined &&
    hasEntityDetailEndpoint(adminPanelStore.activeEntity),
)

// Falls back to the list row when the entity exposes no detail endpoint.
const displayRecord = computed(() => detailRecord.value ?? properties.record)

const entries = computed(() =>
  isRecordValue(displayRecord.value)
    ? Object.entries(displayRecord.value)
    : [],
)

async function loadDetail() {
  const id = recordId.value
  if (!canFetchDetail.value || id === undefined) return

  const url = buildEntityDetailUrl(
    properties.baseUrl,
    adminPanelStore.activeEntity,
    id,
  )
  if (url) await fetchDetail({ url })
}

onMounted(() => {
  loadDetail()
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
        fetchDataStatus === 'pending' ||
        (canFetchDetail && fetchDataStatus === 'idle')
      "
      class="flex h-64 items-center justify-center"
    >
      <MainLoader :wh="40" />
    </div>

    <div
      v-else-if="fetchDataStatus === 'error'"
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
