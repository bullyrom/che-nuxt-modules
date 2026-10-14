import debounce from "lodash-es/debounce"
import { computed, onMounted, onScopeDispose, ref, watch } from "vue"

import {
  buildEntityDetailUrl,
  hasEntityDetailEndpoint,
} from "../../components/admin/entityDetail"
import { isRecordValue } from "../../components/admin/rawValue"
import { resolveRealtimeEntityName } from "../../components/admin/realtime"
import { getRecordId } from "../../components/admin/recordId"
import { useEntityRecordRealtime } from "../../components/admin/useEntityRecordRealtime"
import { useListQueryParameters } from "../../components/admin/useListQueryParameters"
import { useDetailApi, usePaginatedListApi } from "../../composables/api"

import { useAdminPanelStore } from "./index"

import type { AdminPanelConfig } from "../../components/admin/fields/types"

const SEARCH_DEBOUNCE_MS = 300

interface CreateAdminPanelEntityListParameters {
  baseUrl: string
  config?: AdminPanelConfig
}

/**
 * List/detail slice of the admin entity store: lazy pagination, schema filters,
 * view state, realtime and the detail fetch, all built on the library data
 * composables. Called only from the entity store setup.
 */
function createAdminPanelEntityList(
  parameters: CreateAdminPanelEntityListParameters,
) {
  const adminPanelStore = useAdminPanelStore()

  const list = usePaginatedListApi<Record<string, unknown>[]>({ url: "" })
  const detail = useDetailApi<unknown>()
  const query = useListQueryParameters()

  const viewingRecord = ref<Record<string, unknown>>()

  function entityUrl(): string | undefined {
    const entity = adminPanelStore.activeEntity
    if (!entity?.fullBasePath) return undefined
    return `${parameters.baseUrl}${entity.fullBasePath}`
  }

  function currentRealtimeEntityName(): string | undefined {
    return resolveRealtimeEntityName(
      adminPanelStore.activeEntity,
      parameters.config?.realtimeEntityName,
    )
  }

  const realtime = useEntityRecordRealtime({
    client: parameters.config?.realtime,
    closeView,
    getEntityName: currentRealtimeEntityName,
    getViewedRecord: () => viewingRecord.value,
  })

  const loadDebounced = debounce(() => {
    loadCurrentEntity(true)
  }, SEARCH_DEBOUNCE_MS)

  // Registered in the store's own effect scope (not a component's), so they
  // survive entity switches and component remounts. The filter refs opt out of
  // Pinia hydration (see `skipHydrate` in the store), so restoring the store
  // does not look like a filter change and never triggers a redundant reload.
  watch(query.searchQuery, loadDebounced)
  watch(query.queryValues, () => {
    loadCurrentEntity(true)
  })

  // eslint-disable-next-line init-declarations
  let lastFetchedUrl: string | undefined

  async function loadCurrentEntity(force = false) {
    const url = entityUrl()
    if (url === undefined) {
      lastFetchedUrl = undefined
      return
    }
    if (!force && url === lastFetchedUrl && list.data.value !== undefined)
      return
    lastFetchedUrl = url
    realtime.resetListChanges()
    await list.fetchData({ query: query.requestQuery.value, url })
  }

  async function reload() {
    lastFetchedUrl = undefined
    await loadCurrentEntity(true)
  }

  async function fetchNextPage() {
    await list.fetchNextPage()
  }

  // Non-list responses (no `results`) are shown raw instead of rendering nothing.
  const fallbackValue = computed<unknown>(() => {
    if (list.fetchDataStatus.value !== "success") return undefined
    if (list.data.value !== undefined) return undefined
    return list.rawData.value
  })

  const hasDetailEndpoint = computed(() =>
    hasEntityDetailEndpoint(adminPanelStore.activeEntity),
  )

  const detailRecord = computed(() => detail.data.value ?? viewingRecord.value)

  const detailEntries = computed(() =>
    isRecordValue(detailRecord.value)
      ? Object.entries(detailRecord.value)
      : [],
  )

  async function loadRecordDetail() {
    const entity = adminPanelStore.activeEntity
    const record = viewingRecord.value
    if (record === undefined || !hasEntityDetailEndpoint(entity)) return

    const recordId = getRecordId(record)
    if (recordId === undefined) return

    const url = buildEntityDetailUrl(
      parameters.baseUrl,
      entity,
      String(recordId),
    )
    if (url) await detail.fetchData({ url })
  }

  function startView(record: unknown) {
    if (!isRecordValue(record)) return
    viewingRecord.value = record
    realtime.setDetailChannel(currentRealtimeEntityName(), getRecordId(record))
    loadRecordDetail()
  }

  function closeView() {
    viewingRecord.value = undefined
    detail.reset()
    realtime.setDetailChannel(undefined, undefined)
  }

  // A realtime update to the viewed record refetches it.
  watch(realtime.detailRefreshSignal, () => {
    loadRecordDetail()
  })

  onMounted(() => {
    realtime.setListChannel(currentRealtimeEntityName())
  })
  onScopeDispose(realtime.dispose)

  return {
    closeView,
    detailEntries,
    detailRecord,
    detailStatus: detail.fetchDataStatus,
    entityRecords: list.data,
    fallbackValue,
    fetchDataStatus: list.fetchDataStatus,
    fetchNextPage,
    hasDetailEndpoint,
    listChangesCount: realtime.listChangesCount,
    listQueryParameters: query.listQueryParameters,
    queryValues: query.queryValues,
    reload,
    searchQuery: query.searchQuery,
    showNextPageLoader: list.showNextPageLoader,
    startView,
    usesSchemaSearch: query.usesSchemaSearch,
    viewingRecord,
  }
}

export { createAdminPanelEntityList }
export type { CreateAdminPanelEntityListParameters }
