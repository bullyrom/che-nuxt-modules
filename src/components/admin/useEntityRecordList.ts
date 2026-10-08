import { useDebounceFn } from "@vueuse/core"
import { computed, ref, watch } from "vue"

import { useApiDelete, usePaginatedListApi } from "../../composables/api"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import { isRecordValue } from "./rawValue"
import { useListQueryParameters } from "./useListQueryParameters"

import type { AdminPanelConfig } from "./fields/types"

interface UseEntityRecordListParameters {
  baseUrl: string
  config?: AdminPanelConfig
}

const SEARCH_DEBOUNCE_MS = 300

/**
 * Encapsulates everything the admin entity list needs: lazy pagination, the
 * schema-driven filters, deletion and the record-detail/view state.
 */
function useEntityRecordList(parameters: UseEntityRecordListParameters) {
  const adminPanelStore = useAdminPanelStore()

  const {
    data: entityRecords,
    fetchData: fetchEntityRecords,
    fetchDataStatus,
    fetchNextPage,
    rawData,
    showNextPageLoader,
  } = usePaginatedListApi<Record<string, unknown>[]>({ url: "" })

  const { destroy: destroyRecord } = useApiDelete({ url: "" })

  const viewingRecord = ref<Record<string, unknown>>()
  const deletingRecord = ref<Record<string, unknown>>()

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
  const fallbackValue = computed<unknown>(() => {
    if (fetchDataStatus.value !== "success") return undefined
    if (entityRecords.value !== undefined) return undefined
    return rawData.value
  })

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
    if (isRecordValue(record)) viewingRecord.value = record
  }

  function closeView() {
    viewingRecord.value = undefined
  }

  function startDelete(record: unknown) {
    if (isRecordValue(record)) deletingRecord.value = record
  }

  async function doDelete() {
    const record = deletingRecord.value
    if (!record) return
    const entity = adminPanelStore.activeEntity
    const recordId = record.id ?? record.pk
    if (!entity?.fullBasePath || recordId === undefined) return

    const { hooks } = parameters.config ?? {}
    const canDelete = await hooks?.beforeDelete?.(record)
    if (canDelete === false) return

    const response = await destroyRecord({
      id: String(recordId),
      url: `${parameters.baseUrl}${entity.fullBasePath}`,
    })
    if (response !== undefined) {
      await hooks?.afterDelete?.(record)
    }
    // eslint-disable-next-line require-atomic-updates
    deletingRecord.value = undefined
    await reload()
  }

  watch(
    () => adminPanelStore.activeEntity,
    () => {
      viewingRecord.value = undefined
      resetQuery()
      loadCurrentEntity()
    },
  )

  return {
    closeView,
    deletingRecord,
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
