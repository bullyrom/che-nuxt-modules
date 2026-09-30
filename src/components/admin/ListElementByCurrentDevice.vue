<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { ofetch } from "ofetch"

import { useListApi } from "../../composables/api"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import LazyLoadList from "../LazyLoadList.vue"
import MainLoader from "../MainLoader.vue"
import Modal from "../Modal.vue"

import FieldValue from "./FieldValue.vue"
import EntityCreateForm from "./EntityCreateForm.vue"

import type { AdminPanelConfig } from "./fields/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  isMobile?: boolean
}

const properties = defineProps<Properties>()
const adminPanelStore = useAdminPanelStore()

const {
  data: rawData,
  fetchData: fetchRawData,
  fetchDataStatus,
} = useListApi<unknown>({ url: "" })

const entityRecords = ref<Record<string, unknown>[]>()
const nextPageUrl = ref<string | undefined>(undefined)
const isFetchingNext = ref(false)
const showCreateForm = ref(false)
const editingRecord = ref<Record<string, unknown> | undefined>(undefined)
const deletingRecord = ref<Record<string, unknown> | undefined>(undefined)
const searchQuery = ref("")

let searchDebounce: ReturnType<typeof setTimeout> | undefined

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    loadCurrentEntity(true)
  }, 300)
})

// eslint-disable-next-line no-useless-assignment
const showLoader = computed(() => {
  if (fetchDataStatus.value === "pending") return true
  return isFetchingNext.value
})

function extractRecords(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (typeof data === "object" && data !== null && "results" in data) {
    const { results } = data as Record<string, unknown>
    if (Array.isArray(results)) return results as Record<string, unknown>[]
  }
  return []
}

function extractNextPage(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "next" in data) {
    const nextValue = (data as Record<string, unknown>).next
    if (typeof nextValue === "string") return nextValue
  }
  return undefined
}

// eslint-disable-next-line init-declarations
let lastFetchedUrl: string | undefined

async function loadCurrentEntity(force = false) {
  const entity = adminPanelStore.activeEntity
  if (!entity?.fullBasePath) {
    entityRecords.value = undefined
    nextPageUrl.value = undefined
    lastFetchedUrl = undefined
    return
  }

  const url = `${properties.baseUrl}${entity.fullBasePath}`
  if (!force && url === lastFetchedUrl && entityRecords.value !== undefined) return
  lastFetchedUrl = url

  entityRecords.value = undefined
  nextPageUrl.value = undefined

  const queryParams = searchQuery.value ? { search: searchQuery.value } : undefined
  await fetchRawData({ query: queryParams, url })
  if (fetchDataStatus.value === "success" && rawData.value) {
    entityRecords.value = extractRecords(rawData.value)
    nextPageUrl.value = extractNextPage(rawData.value)
  }
}

watch(() => adminPanelStore.activeEntity, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchQuery.value = ""
  loadCurrentEntity()
})

async function fetchNextPage() {
  const nextUrl = nextPageUrl.value
  if (!nextUrl || isFetchingNext.value) return

  isFetchingNext.value = true
  try {
    await fetchRawData({ url: nextUrl })
    if (fetchDataStatus.value === "success" && rawData.value) {
      const records = extractRecords(rawData.value)
      if (entityRecords.value) {
        entityRecords.value.push(...records)
      }
      // eslint-disable-next-line require-atomic-updates
      nextPageUrl.value = extractNextPage(rawData.value)
    }
  } finally {
    // eslint-disable-next-line require-atomic-updates
    isFetchingNext.value = false
  }
}

async function doDelete() {
  const record = deletingRecord.value
  if (!record) return
  const entity = adminPanelStore.activeEntity
  const recordId = record.id ?? record.pk
  if (!entity?.fullBasePath || recordId === undefined) return

  const { hooks } = properties.config ?? {}
  const canDelete = await hooks?.beforeDelete?.(record)
  if (canDelete === false) return

  try {
    await ofetch(`${properties.baseUrl}${entity.fullBasePath}${String(recordId)}/`, {
      method: "DELETE",
    })
    await hooks?.afterDelete?.(record)
    deletingRecord.value = undefined
    lastFetchedUrl = undefined
    loadCurrentEntity()
  } catch {
    // silently fail
  }
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
          class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none transition-colors focus:border-blue-400"
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
          :show-loader="showLoader"
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
                  @click="editingRecord = item; showCreateForm = true"
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
    @close="showCreateForm = false; editingRecord = undefined"
    @saved="showCreateForm = false; editingRecord = undefined; lastFetchedUrl = undefined; loadCurrentEntity()"
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
