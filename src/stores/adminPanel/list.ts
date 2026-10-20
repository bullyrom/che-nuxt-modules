import debounce from "lodash-es/debounce"
import { computed, onMounted, onScopeDispose, watch } from "vue"

import { resolveRealtimeEntityName } from "../../components/admin/realtime"
import { useEntityRecordRealtime } from "../../components/admin/useEntityRecordRealtime"
import { useListQueryParameters } from "../../components/admin/useListQueryParameters"
import { usePaginatedListApi } from "../../composables/api"
import { createInstanceRegistry } from "../instanceRegistry"

import { createAdminPanelEntityDeletion } from "./entityDeletion"
import { resolveConfig, resolveEntity } from "./instance"
import { extractListQueryParameters } from "./queryParameters"

import { useAdminPanelStore } from "./index"

import type { AdminInstanceParameters } from "./instance"
import type { ListQueryParameters } from "./queryParameters"
import type { ParsedEntity } from "./types"

const SEARCH_DEBOUNCE_MS = 300

/**
 * List slice of a keyed admin instance: lazy pagination, schema filters,
 * deletion and the realtime list channel, all built on the library data
 * composables. The entity and config are resolved per instance (standalone) or
 * from the global admin store (inside the admin, where all entities reuse one
 * instance key).
 */
function createAdminPanelList(parameters: AdminInstanceParameters) {
  const adminPanelStore = useAdminPanelStore()

  function currentEntity(): ParsedEntity | undefined {
    return resolveEntity(parameters, () => adminPanelStore.activeEntity)
  }

  function currentConfig() {
    return resolveConfig(parameters, adminPanelStore.config)
  }

  const list = usePaginatedListApi<Record<string, unknown>[]>({ url: "" })

  const listQueryParameters = computed<ListQueryParameters>(() => {
    const { schema } = adminPanelStore
    const entity = currentEntity()
    if (schema === undefined) return { filters: [], sorts: [] }
    return extractListQueryParameters(entity?.listOperation, schema)
  })

  const query = useListQueryParameters({ listQueryParameters })

  const deletion = createAdminPanelEntityDeletion({
    baseUrl: parameters.baseUrl,
    reload: () => reload(),
    resolveConfig: currentConfig,
    resolveEntity: currentEntity,
  })

  function currentRealtimeEntityName(): string | undefined {
    return resolveRealtimeEntityName(
      currentEntity(),
      currentConfig()?.realtimeEntityName,
    )
  }

  const realtime = useEntityRecordRealtime({
    client: currentConfig()?.realtime,
    closeView: () => undefined,
    detail: false,
    getEntityName: currentRealtimeEntityName,
    getViewedRecord: () => undefined,
  })

  function entityUrl(): string | undefined {
    const entity = currentEntity()
    if (!entity?.fullBasePath) return undefined
    return `${parameters.baseUrl}${entity.fullBasePath}`
  }

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

  // Let the loader reflect a manual record edit/field-group change before the
  // server reload catches up.
  function patchRecord(
    record: Record<string, unknown>,
    changed: Partial<Record<string, unknown>>,
  ) {
    Object.assign(record, changed)
  }

  const loadDebounced = debounce(() => {
    loadCurrentEntity(true)
  }, SEARCH_DEBOUNCE_MS)

  // Filters are programmatically cleared when the active entity changes; the
  // flag stops that reset from scheduling a redundant second request (the
  // entity switch already triggers its own load).

  let ignoringQueryReset = false

  watch(
    query.searchQuery,
    () => {
      if (!ignoringQueryReset) loadDebounced()
    },
    { flush: "sync" },
  )
  watch(
    query.queryValues,
    () => {
      if (!ignoringQueryReset) loadCurrentEntity(true)
    },
    { flush: "sync" },
  )

  // Keep the list room in sync with the active entity. This watcher lives in
  // the keyed store (not in a component lifecycle hook), so it also runs when a
  // store created during SSR is hydrated on the client and when the admin
  // reuses the same instance key for another entity or route.
  watch(
    () => currentRealtimeEntityName(),
    (entityName) => realtime.setListChannel(entityName),
    { immediate: true },
  )

  // A switch inside the admin reuses the same instance key: reset and refetch.
  watch(
    () => currentEntity()?.fullBasePath,
    () => {
      ignoringQueryReset = true
      query.reset()
      ignoringQueryReset = false
      list.reset()
      lastFetchedUrl = undefined
      loadCurrentEntity(true)
    },
  )

  // Non-list responses (no `results`) are shown raw instead of rendering nothing.
  const fallbackValue = computed<unknown>(() => {
    if (list.fetchDataStatus.value !== "success") return undefined
    if (list.data.value !== undefined) return undefined
    return list.rawData.value
  })

  onMounted(() => {
    // Records live in the keyed store, so a fresh key (or a client that did
    // not receive server-rendered data) fetches the first page after mount.
    if (list.data.value === undefined) loadCurrentEntity()
  })
  onScopeDispose(realtime.dispose)

  return {
    ...deletion,
    count: list.count,
    entityRecords: list.data,
    fallbackValue,
    fetchDataStatus: list.fetchDataStatus,
    fetchNextPage,
    listChangesCount: realtime.listChangesCount,
    listQueryParameters: query.listQueryParameters,
    nextPageUrl: list.nextPageUrl,
    patchRecord,
    previousPageUrl: list.previousPageUrl,
    queryValues: query.queryValues,
    reload,
    searchQuery: query.searchQuery,
    showNextPageLoader: list.showNextPageLoader,
    usesSchemaSearch: query.usesSchemaSearch,
  }
}

type AdminPanelListStore = ReturnType<typeof createAdminPanelList>

const listRegistry = createInstanceRegistry<
  AdminInstanceParameters,
  AdminPanelListStore
>({
  idPrefix: "admin-list",
  setup: createAdminPanelList,
})

/** Returns (creating on first use) the list store for the instance key. */
function useAdminPanelListStore(
  parameters: AdminInstanceParameters,
): AdminPanelListStore {
  return listRegistry.use(parameters)
}

/** Returns an already-created list store, or `undefined`. */
function getAdminPanelListStore(
  instanceKey: string | undefined,
): AdminPanelListStore | undefined {
  return listRegistry.get(instanceKey)
}

export { createAdminPanelList, getAdminPanelListStore, useAdminPanelListStore }
export type { AdminPanelListStore }
