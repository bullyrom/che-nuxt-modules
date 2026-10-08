<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core"
import { computed, ref, watch } from "vue"

import { useApiDelete, usePaginatedListApi } from "../../composables/api"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import LazyLoadList from "../LazyLoadList.vue"
import MainLoader from "../MainLoader.vue"
import Modal from "../Modal.vue"

import EntityCreateForm from "./EntityCreateForm.vue"
import EntityRecordCard from "./EntityRecordCard.vue"
import QueryParametersMenu from "./QueryParametersMenu.vue"
import { isRecordValue } from "./rawValue"
import RawValue from "./RawValue.vue"
import { useListQueryParameters } from "./useListQueryParameters"

import type { AdminPanelConfig } from "./fields/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  isMobile?: boolean
}

const properties = defineProps<Properties>()
const adminPanelStore = useAdminPanelStore()

const {
  data: entityRecords,
  fetchData: fetchEntityRecords,
  fetchDataStatus,
  fetchNextPage,
  rawData,
  showNextPageLoader,
} = usePaginatedListApi<Record<string, unknown>>({ url: "" })

const { destroy: destroyRecord } = useApiDelete({ url: "" })

const showCreateForm = ref(false)
const editingRecord = ref<Record<string, unknown> | undefined>(undefined)
const deletingRecord = ref<Record<string, unknown> | undefined>(undefined)

const {
  listQueryParameters,
  queryValues,
  requestQuery,
  reset: resetQuery,
  searchQuery,
  usesSchemaSearch,
} = useListQueryParameters()

// A successful response that is not a paginated list (e.g. the OpenAPI schema
// endpoint) has no `results`, so it is shown raw instead of rendering nothing.
const fallbackValue = computed(() => {
  if (fetchDataStatus.value !== "success") return undefined
  if (entityRecords.value !== undefined) return undefined
  return rawData.value
})

const SEARCH_DEBOUNCE_MS = 300

const loadDebounced = useDebounceFn(
  () => loadCurrentEntity(true),
  SEARCH_DEBOUNCE_MS,
)

watch(searchQuery, loadDebounced)

// Filter/sort updates are already debounced inside QueryParametersMenu.
watch(queryValues, () => {
  loadCurrentEntity(true)
})

// eslint-disable-next-line init-declarations
let lastFetchedUrl: string | undefined

async function loadCurrentEntity(force = false) {
  const entity = adminPanelStore.activeEntity
  if (!entity?.fullBasePath) {
    lastFetchedUrl = undefined
    return
  }

  const url = `${properties.baseUrl}${entity.fullBasePath}`
  if (!force && url === lastFetchedUrl && entityRecords.value !== undefined)
    return
  lastFetchedUrl = url

  await fetchEntityRecords({ query: requestQuery.value, url })
}

watch(
  () => adminPanelStore.activeEntity,
  () => {
    resetQuery()
    loadCurrentEntity()
  },
)

async function doDelete() {
  const record = deletingRecord.value
  if (!record) return
  const entity = adminPanelStore.activeEntity
  const recordId = record.id ?? record.pk
  if (!entity?.fullBasePath || recordId === undefined) return

  const { hooks } = properties.config ?? {}
  const canDelete = await hooks?.beforeDelete?.(record)
  if (canDelete === false) return

  const response = await destroyRecord({
    id: String(recordId),
    url: `${properties.baseUrl}${entity.fullBasePath}`,
  })
  if (response !== undefined) {
    await hooks?.afterDelete?.(record)
  }
  // eslint-disable-next-line require-atomic-updates
  deletingRecord.value = undefined
  lastFetchedUrl = undefined
  loadCurrentEntity(true)
}

function startEdit(record: unknown) {
  if (!isRecordValue(record)) return
  editingRecord.value = record
  showCreateForm.value = true
}

function startDelete(record: unknown) {
  if (isRecordValue(record)) deletingRecord.value = record
}

function closeCreateForm() {
  showCreateForm.value = false
  editingRecord.value = undefined
}

function handleSaved() {
  closeCreateForm()
  lastFetchedUrl = undefined
  loadCurrentEntity(true)
}
</script>

<template>
  <div
    class="flex h-full flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)]"
  >
    <div
      v-if="adminPanelStore.activeEntity"
      class="flex items-center justify-between border-b border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-4 py-3"
    >
      <button
        class="rounded border border-[var(--ch-admin-border)] px-3 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:text-[var(--ch-admin-text)]"
        @click="adminPanelStore.clearEntity()"
      >
        &larr; All endpoints
      </button>
      <div class="flex items-center gap-3">
        <button
          v-if="adminPanelStore.activeEntity?.createOperation"
          class="rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)] px-3 py-1.5 text-sm font-medium text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
          @click="showCreateForm = true"
        >
          + New
        </button>
        <div class="text-right">
          <h2 class="text-sm font-semibold text-[var(--ch-admin-text)]">
            {{ adminPanelStore.activeEntity.entityName }}
          </h2>
          <p class="text-xs text-[var(--ch-admin-text-muted)]">
            {{ adminPanelStore.activeEntity.fullBasePath }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="adminPanelStore.activeEntity"
      class="flex-1 overflow-y-auto p-4"
    >
      <div class="mb-4 space-y-3">
        <input
          v-if="!usesSchemaSearch"
          v-model="searchQuery"
          class="w-full rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-3 py-1.5 text-sm text-[var(--ch-admin-text)] transition-colors outline-none placeholder:text-[var(--ch-admin-text-muted)] focus:border-[var(--ch-admin-accent)]"
          placeholder="Search..."
          type="text"
        />
        <QueryParametersMenu
          v-model="queryValues"
          :components="properties.config?.fields?.defaultComponents"
          :filters="listQueryParameters.filters"
          :sorts="listQueryParameters.sorts"
        />
      </div>

      <div
        v-if="entityRecords === undefined && fetchDataStatus === 'pending'"
        class="flex h-64 items-center justify-center"
      >
        <MainLoader :wh="40" />
      </div>

      <div
        v-else-if="fetchDataStatus === 'error'"
        class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-danger-text)]"
      >
        Failed to load data
      </div>

      <template v-else-if="fallbackValue !== undefined">
        <div class="mb-3 text-xs text-[var(--ch-admin-text-muted)]">
          This endpoint does not return a list — showing the raw response.
        </div>
        <RawValue :value="fallbackValue" />
      </template>

      <template v-else-if="entityRecords !== undefined">
        <div
          v-if="entityRecords.length === 0"
          class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-text-muted)]"
        >
          No records found
        </div>

        <LazyLoadList
          v-else
          v-slot="{ item, index }"
          :items="entityRecords"
          :show-loader="showNextPageLoader"
          :fetch-visible-item-number="4"
          list-class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
          @fetch-next-page="fetchNextPage()"
        >
          <EntityRecordCard
            :index="index"
            :item="item"
            @delete="startDelete"
            @edit="startEdit"
          />
        </LazyLoadList>
      </template>

      <div
        v-else
        class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-text-muted)]"
      >
        No data
      </div>
    </div>

    <div
      v-else
      class="flex flex-1 items-center justify-center text-sm text-[var(--ch-admin-text-muted)]"
    >
      Select an endpoint from the sidebar
    </div>
  </div>

  <EntityCreateForm
    :base-url="properties.baseUrl"
    :config="properties.config"
    :edit-record="editingRecord"
    :show="showCreateForm"
    @close="closeCreateForm()"
    @saved="handleSaved()"
  />

  <Modal
    :show="deletingRecord !== undefined"
    @set-visible="deletingRecord = undefined"
  >
    <div class="px-6 py-5 text-center">
      <p class="text-sm text-[var(--ch-admin-text-muted)]">
        Delete
        {{ adminPanelStore.activeEntity?.entityName ?? "record" }}
        #{{ deletingRecord?.id ?? deletingRecord?.pk ?? "?" }}?
      </p>
      <div class="mt-4 flex justify-center gap-3">
        <button
          class="rounded border border-[var(--ch-admin-border)] px-4 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
          @click="deletingRecord = undefined"
        >
          Cancel
        </button>
        <button
          class="rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          @click="doDelete()"
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
</template>
