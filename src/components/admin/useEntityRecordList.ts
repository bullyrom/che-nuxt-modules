import { computed, toRefs } from "vue"

import { useScrollToTop } from "../../composables/useScrollToTop"
import { resolveAdminEntity } from "../../stores/adminPanel/entityKey"
import { findAdminEntity } from "../../stores/adminPanel/findEntity"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import {
  resolveEntityBaseUrl,
  resolveEntityConfig,
} from "../../stores/adminPanel/instance"
import { useAdminPanelListStore } from "../../stores/adminPanel/list"

import { isAdminInternalMenuEnabled, listConfigToPanelConfig } from "./config"
import { getAdminListFieldSlotKeys } from "./entityList"
import { buildListGridClass } from "./grid"
import { useAdminTheme } from "./theme"

import type {
  AdminRecordListActions,
  AdminRecordListProperties,
} from "./entityRecordListTypes"
import type {
  AdminHeaderComponentProperties,
  AdminListComponentProperties,
} from "./fields/types"

const LIST_FETCH_VISIBLE_ITEM_NUMBER = 4

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
      if (properties.namespace !== undefined) {
        return findAdminEntity(
          adminPanelStore.parsedEntities,
          properties.entityName,
          properties.namespace,
        )
      }
      return resolveAdminEntity(
        adminPanelStore.parsedEntities,
        properties.entityName,
      )
    }
    return adminPanelStore.activeEntity
  })

  const resolvedBaseUrl = computed(() =>
    resolveEntityBaseUrl(
      currentEntity.value,
      properties.baseUrl ?? adminPanelStore.baseUrl ?? "",
    ),
  )

  const store = useAdminPanelListStore({
    baseUrl: resolvedBaseUrl.value,
    config: properties.config,
    entity: () => currentEntity.value,
    instanceKey: properties.instanceKey ?? "admin-1",
    scope: currentEntity.value?.service,
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
  const { theme: adminTheme, themeStyle } = useAdminTheme(
    () => instanceConfig.value?.theme,
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
    adminTheme,
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
    themeStyle,
    updateIsScrolledDown,
    usesSchemaSearch,
  }
}

export { LIST_FETCH_VISIBLE_ITEM_NUMBER, useEntityRecordList }
export type {
  AdminRecordListActions,
  AdminRecordListProperties,
} from "./entityRecordListTypes"
