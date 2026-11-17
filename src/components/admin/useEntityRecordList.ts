import { computed, toRefs } from "vue"

import { useScrollToTop } from "../../composables/useScrollToTop"
import { findAdminEntity } from "../../stores/adminPanel/findEntity"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import { resolveEntityConfig } from "../../stores/adminPanel/instance"
import { useAdminPanelListStore } from "../../stores/adminPanel/list"

import { isAdminInternalMenuEnabled, listConfigToPanelConfig } from "./config"
import { getAdminListFieldSlotKeys } from "./entityList"
import { buildListGridClass } from "./grid"

import type { AdminListCompatibleItems } from "./entityList"
import type {
  AdminHeaderComponentProperties,
  AdminListComponentProperties,
  AdminListConfig,
  AdminPanelConfig,
} from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

const LIST_FETCH_VISIBLE_ITEM_NUMBER = 4

interface AdminRecordListProperties<
  Base extends Record<string, unknown>,
  Item extends Record<string, unknown>,
  Overridden extends string,
> {
  baseUrl?: string
  config?: AdminPanelConfig
  /** Detail URL builder; when set the View action becomes a link. */
  detailHref?: (record: Item) => string | undefined
  entity?: ParsedEntity
  /** Finds the entity in the shared schema by admin entity name. */
  entityName?: string
  instanceKey?: string
  isMobile?: boolean
  /**
   * A host-provided records array rendered instead of the fetched list. The
   * item type is checked against the base entity type; fields rendered by their
   * own slots are excluded from the check via `Overridden`.
   */
  items?: AdminListCompatibleItems<Base, Item, Overridden>
  /** Embedded-list config fragment (used when `config` is not passed). */
  listConfig?: AdminListConfig
  /** Narrows the entity lookup when a name exists in several namespaces. */
  namespace?: string
  /** Show an in-place detail action even without a URL builder. */
  showDetail?: boolean
}

/** Host callbacks the list forwards to its parent component. */
interface AdminRecordListActions<Item> {
  onCreate: () => void
  onDelete: (record: Item) => void
  onEdit: (record: Item) => void
  onFetchNextPage: () => void
  onView: (record: Item) => void
}

/**
 * State and actions for the generic admin list. Keeps the component itself
 * focused on markup and slot forwarding; all store wiring, entity lookup,
 * pagination and slot-key discovery live here.
 */
function useEntityRecordList<
  Base extends Record<string, unknown>,
  Item extends Record<string, unknown>,
  Overridden extends string,
>(
  properties: AdminRecordListProperties<Base, Item, Overridden>,
  actions: AdminRecordListActions<Item>,
  slotNames: readonly string[],
) {
  const adminPanelStore = useAdminPanelStore()
  const fieldSlotKeys = computed<string[]>(() =>
    getAdminListFieldSlotKeys(slotNames),
  )

  const currentEntity = computed(() => {
    if (properties.entity !== undefined) return properties.entity
    if (properties.entityName !== undefined) {
      return findAdminEntity(
        adminPanelStore.parsedEntities,
        properties.entityName,
        properties.namespace,
      )
    }
    return adminPanelStore.activeEntity
  })

  const resolvedBaseUrl = computed(
    () => properties.baseUrl ?? adminPanelStore.baseUrl ?? "",
  )

  const store = useAdminPanelListStore({
    baseUrl: resolvedBaseUrl.value,
    config: properties.config,
    entity: () => currentEntity.value,
    instanceKey: properties.instanceKey ?? "admin-1",
  })

  const {
    count,
    deletingRecord,
    entityRecords,
    fallbackValue,
    fetchDataStatus,
    listChangesCount,
    listQueryParameters,
    nextPageUrl,
    previousPageUrl,
    queryValues,
    searchQuery,
    showNextPageLoader,
    usesSchemaSearch,
  } = toRefs(store)

  const { doDelete, fetchNextPage, patchRecord, reload } = store

  const { containerRef, isScrolledDown, scrollToTop, updateIsScrolledDown } =
    useScrollToTop()

  const customItems = computed(() => properties.items !== undefined)
  const displayedItems = computed<Item[] | undefined>(
    () =>
      (properties.items as Item[] | undefined) ??
      (entityRecords.value as Item[] | undefined),
  )

  const listFragmentConfig = computed(() =>
    properties.listConfig === undefined
      ? undefined
      : listConfigToPanelConfig(
          properties.listConfig,
          currentEntity.value?.entityName,
        ),
  )
  const instanceConfig = computed(
    () =>
      properties.config ?? listFragmentConfig.value ?? adminPanelStore.config,
  )
  const entityConfig = computed(() =>
    resolveEntityConfig(instanceConfig.value, currentEntity.value),
  )

  const detailHref = computed<
    ((record: Item) => string | undefined) | undefined
  >(
    () =>
      properties.detailHref ??
      (properties.listConfig?.detailHref as
        | ((record: Item) => string | undefined)
        | undefined),
  )
  const canShowDetail = computed(
    () => properties.showDetail === true || detailHref.value !== undefined,
  )

  const customList = computed(() => instanceConfig.value?.views?.list)
  const customListHeader = computed(
    () => instanceConfig.value?.views?.listHeader,
  )
  const customListFooter = computed(
    () => instanceConfig.value?.views?.listFooter,
  )
  const customHeader = computed(() => instanceConfig.value?.views?.header)

  const gridColumns = computed(
    () => entityConfig.value?.gridColumns ?? instanceConfig.value?.gridColumns,
  )
  const listGridClass = computed(() => buildListGridClass(gridColumns.value))
  const showInternalMenu = computed(() =>
    isAdminInternalMenuEnabled(instanceConfig.value),
  )

  // The database-backed list starts loading in `onMounted`, after the server
  // has already rendered the shell. Treat `idle` (SSR) and `pending` (first
  // client fetch) as the same loading state so hydration sees identical markup.
  const isInitialLoading = computed(
    () =>
      !customItems.value &&
      entityRecords.value === undefined &&
      (fetchDataStatus.value === "idle" ||
        fetchDataStatus.value === "pending"),
  )

  const lazyShowLoader = computed(
    () => !customItems.value && showNextPageLoader.value,
  )

  const customListProperties = computed<AdminListComponentProperties>(() => ({
    count: count.value,
    detailHref: detailHref.value as
      | ((record: Record<string, unknown>) => string | undefined)
      | undefined,
    entityName: currentEntity.value?.entityName,
    fetchNextPage: handleFetchNextPage,
    gridColumns: gridColumns.value,
    nextPageUrl: nextPageUrl.value ?? undefined,
    previousPageUrl: previousPageUrl.value ?? undefined,
    records: displayedItems.value,
    reload,
    showNextPageLoader: lazyShowLoader.value,
    startCreate: actions.onCreate,
    status: fetchDataStatus.value,
  }))

  const headerProperties = computed<AdminHeaderComponentProperties>(() => ({
    canCreate: Boolean(currentEntity.value?.createOperation),
    clearEntity: () => adminPanelStore.clearEntity(),
    entity: currentEntity.value,
    listChangesCount: listChangesCount.value,
    reload: () => {
      reload()
    },
    startCreate: actions.onCreate,
  }))

  function handlePatch(item: unknown, changed: Record<string, unknown>) {
    if (item && typeof item === "object") {
      patchRecord(item as Record<string, unknown>, changed)
    }
  }

  function itemHref(item: unknown): string | undefined {
    const buildHref = detailHref.value
    if (buildHref === undefined) return undefined
    if (item === null || typeof item !== "object") return undefined
    return buildHref(item as Item)
  }

  async function handleFetchNextPage() {
    if (customItems.value) {
      actions.onFetchNextPage()
      return
    }
    await fetchNextPage()
  }

  function handleDelete(item: unknown) {
    if (item === null || typeof item !== "object") return
    actions.onDelete(item as Item)
    if (!customItems.value) store.startDelete(item)
  }

  function handleEdit(item: unknown) {
    if (item === null || typeof item !== "object") return
    actions.onEdit(item as Item)
  }

  function handleView(item: unknown) {
    if (item === null || typeof item !== "object") return
    actions.onView(item as Item)
  }

  return {
    canShowDetail,
    clearEntity: () => adminPanelStore.clearEntity(),
    containerRef,
    count,
    customHeader,
    customList,
    customListFooter,
    customListHeader,
    customListProperties,
    deletingRecord,
    displayedItems,
    doDelete,
    entityConfig,
    fallbackValue,
    fetchDataStatus,
    fieldSlotKeys,
    handleDelete,
    handleEdit,
    handleFetchNextPage,
    handlePatch,
    handleView,
    headerProperties,
    instanceConfig,
    isInitialLoading,
    isScrolledDown,
    itemHref,
    lazyShowLoader,
    LIST_FETCH_VISIBLE_ITEM_NUMBER,
    listChangesCount,
    listGridClass,
    listQueryParameters,
    queryValues,
    reload,
    scrollToTop,
    searchQuery,
    showInternalMenu,
    updateIsScrolledDown,
    usesSchemaSearch,
  }
}

export { LIST_FETCH_VISIBLE_ITEM_NUMBER, useEntityRecordList }
export type { AdminRecordListActions, AdminRecordListProperties }
