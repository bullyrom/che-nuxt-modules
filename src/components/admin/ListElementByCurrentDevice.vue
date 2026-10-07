<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core"
import { ref, watch } from "vue"

import { useApiDelete, usePaginatedListApi } from "../../composables/api"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import LazyLoadList from "../LazyLoadList.vue"
import MainLoader from "../MainLoader.vue"
import Modal from "../Modal.vue"

import EntityCreateForm from "./EntityCreateForm.vue"
import FieldValue from "./FieldValue.vue"

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
  showNextPageLoader,
} = usePaginatedListApi<Record<string, unknown>>({ url: "" })

const { destroy: destroyRecord } = useApiDelete({ url: "" })

const showCreateForm = ref(false)
const editingRecord = ref<Record<string, unknown> | undefined>(undefined)
const deletingRecord = ref<Record<string, unknown> | undefined>(undefined)
const searchQuery = ref("")

const SEARCH_DEBOUNCE_MS = 300

const loadDebounced = useDebounceFn(
  () => loadCurrentEntity(true),
  SEARCH_DEBOUNCE_MS,
)

watch(searchQuery, loadDebounced)

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

  const queryParameters = searchQuery.value
    ? { search: searchQuery.value }
    : undefined
  await fetchEntityRecords({ query: queryParameters, url })
}

watch(
  () => adminPanelStore.activeEntity,
  () => {
    searchQuery.value = ""
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

function startEdit(record: Record<string, unknown>) {
  editingRecord.value = record
  showCreateForm.value = true
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

function getObjectKeys(object: Record<string, unknown>): string[] {
  return Object.keys(object)
}
</script>

<template>
  <div class="flex h-full flex-1 flex-col overflow-y-auto bg-gray-50">
    <div
      v-if="adminPanelStore.activeEntity"
      class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3"
    >
      <button
        class="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
        @click="adminPanelStore.clearEntity()"
      >
        &larr; All endpoints
      </button>
      <div class="flex items-center gap-3">
        <button
          v-if="adminPanelStore.activeEntity?.createOperation"
          class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          @click="showCreateForm = true"
        >
          + New
        </button>
        <div class="text-right">
          <h2 class="text-sm font-semibold text-gray-700">
            {{ adminPanelStore.activeEntity.entityName }}
          </h2>
          <p class="text-xs text-gray-400">
            {{ adminPanelStore.activeEntity.fullBasePath }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="adminPanelStore.activeEntity"
      class="flex-1 overflow-y-auto p-4"
    >
      <div class="mb-4">
        <input
          v-model="searchQuery"
          class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm transition-colors outline-none focus:border-blue-400"
          placeholder="Search..."
          type="text"
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
        class="flex h-64 items-center justify-center text-sm text-red-500"
      >
        Failed to load data
      </div>

      <template v-else-if="entityRecords !== undefined">
        <div
          v-if="entityRecords.length === 0"
          class="flex h-64 items-center justify-center text-sm text-gray-400"
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
          <div
            class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-400"
                >#{{ index + 1 }}</span
              >
              <div class="flex items-center gap-1">
                <button
                  class="rounded px-2 py-0.5 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="Edit"
                  @click="startEdit(item)"
                >
                  ✎
                </button>
                <button
                  class="rounded px-2 py-0.5 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Delete"
                  @click="deletingRecord = item"
                >
                  ✕
                </button>
              </div>
              <span
                v-if="item.id !== undefined"
                class="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500"
              >
                ID: {{ item.id }}
              </span>
            </div>
            <div class="space-y-2">
              <div
                v-for="key in getObjectKeys(item)"
                :key="key"
                class="flex items-start gap-2"
              >
                <span
                  class="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500"
                >
                  {{ key }}
                </span>
                <FieldValue :value="item[key]" />
              </div>
            </div>
          </div>
        </LazyLoadList>
      </template>
    </div>

    <div
      v-else
      class="flex flex-1 items-center justify-center text-sm text-gray-400"
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
      <p class="text-sm text-gray-600">
        Delete
        {{ adminPanelStore.activeEntity?.entityName ?? "record" }}
        #{{ deletingRecord?.id ?? deletingRecord?.pk ?? "?" }}?
      </p>
      <div class="mt-4 flex justify-center gap-3">
        <button
          class="rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
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
