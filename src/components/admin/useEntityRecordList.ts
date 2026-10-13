import debounce from "lodash-es/debounce"
import { computed, nextTick, onMounted, onScopeDispose, ref, watch } from "vue"

import { usePaginatedListApi } from "../../composables/api"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import { isRecordValue } from "./rawValue"
import { resolveRealtimeEntityName } from "./realtime"
import { getRecordId } from "./recordId"
import { useEntityRecordDeletion } from "./useEntityRecordDeletion"
import { useEntityRecordRealtime } from "./useEntityRecordRealtime"
import { useListQueryParameters } from "./useListQueryParameters"

import type { AdminPanelConfig } from "./fields/types"

interface UseEntityRecordListParameters {
  baseUrl: string
  config?: AdminPanelConfig
}

const SEARCH_DEBOUNCE_MS = 300

/**
 * Encapsulates everything the admin entity list needs: lazy pagination, the
 * schema-driven filters, deletion, realtime and the record-detail/view state.
 */
function useEntityRecordList(parameters: UseEntityRecordListParameters) {
  const adminPanelStore = useAdminPanelStore()

  const {
    data: entityRecords,
    fetchData: fetchEntityRecords,
    fetchDataStatus,
    fetchNextPage,
    rawData,
    reset: resetEntityRecords,
    showNextPageLoader,
  } = usePaginatedListApi<Record<string, unknown>[]>({ url: "" })

  const viewingRecord = ref<Record<string, unknown>>()

  const {
    listQueryParameters,
    queryValues,
    requestQuery,
    reset: resetQuery,
    searchQuery,
    usesSchemaSearch,
  } = useListQueryParameters()

  // The backend emits the Django model label in realtime rooms, while the admin
  // derives names from the URL — the host maps them via `realtimeEntityName`.
  function currentRealtimeEntityName(): string | undefined {
    return resolveRealtimeEntityName(
      adminPanelStore.activeEntity,
      parameters.config?.realtimeEntityName,
    )
  }

  const { detailRefreshSignal, dispose, setDetailChannel, setListChannel } =
    useEntityRecordRealtime({
      client: parameters.config?.realtime,
      closeView,
      getEntityName: currentRealtimeEntityName,
      getViewedRecord: () => viewingRecord.value,
      reload,
    })

  const { deletingRecord, doDelete, startDelete } = useEntityRecordDeletion({
    baseUrl: parameters.baseUrl,
    config: parameters.config,
    getActiveEntity: () => adminPanelStore.activeEntity,
    reload,
  })

  onScopeDispose(dispose)

  // A successful response that is not a paginated list (e.g. the OpenAPI schema
  // endpoint) has no `results`, so it is shown raw instead of rendering nothing.
  const fallbackValue = computed<unknown>(() => {
    if (fetchDataStatus.value !== "success") return undefined
    if (entityRecords.value !== undefined) return undefined
    return rawData.value
  })

  // While switching entities the search and filter state is cleared
  // programmatically; those writes must not schedule an extra list request —
  // the switch handler already triggers exactly one reload.
  const isSwitchingEntity = ref(false)

  const loadDebounced = debounce(() => {
    if (isSwitchingEntity.value) return
    loadCurrentEntity(true)
  }, SEARCH_DEBOUNCE_MS)

  watch(searchQuery, loadDebounced)

  // Filter/sort updates are already debounced inside QueryParametersMenu.
  watch(queryValues, () => {
    if (isSwitchingEntity.value) return
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

    const url = `${parameters.baseUrl}${entity.fullBasePath}`
    if (!force && url === lastFetchedUrl && entityRecords.value !== undefined)
      return
    lastFetchedUrl = url

    await fetchEntityRecords({ query: requestQuery.value, url })
  }

  async function reload() {
    lastFetchedUrl = undefined
    await loadCurrentEntity(true)
  }

  function startView(record: unknown) {
    if (!isRecordValue(record)) return
    viewingRecord.value = record
    setDetailChannel(currentRealtimeEntityName(), getRecordId(record))
  }

  function closeView() {
    viewingRecord.value = undefined
    setDetailChannel(undefined, undefined)
  }

  watch(
    () => adminPanelStore.activeEntity,
    () => {
      viewingRecord.value = undefined
      isSwitchingEntity.value = true
      loadDebounced.cancel()
      setDetailChannel(undefined, undefined)
      setListChannel(currentRealtimeEntityName())
      // Drop the previous entity records so the list shows the loader instead
      // of stale cards while the new entity is loading.
      resetEntityRecords()
      resetQuery()
      loadCurrentEntity(true)
      nextTick(() => {
        isSwitchingEntity.value = false
      })
    },
  )

  // Subscribe after mount (not during setup) so a socket event can never change
  // the data used for hydration; the list may already have an entity selected
  // (e.g. coming back to the admin).
  onMounted(() => {
    setListChannel(currentRealtimeEntityName())
  })

  return {
    closeView,
    deletingRecord,
    detailRefreshSignal,
    doDelete,
    entityRecords,
    fallbackValue,
    fetchDataStatus,
    fetchNextPage,
    listQueryParameters,
    queryValues,
    reload,
    searchQuery,
    showNextPageLoader,
    startDelete,
    startView,
    usesSchemaSearch,
    viewingRecord,
  }
}

export { useEntityRecordList }
