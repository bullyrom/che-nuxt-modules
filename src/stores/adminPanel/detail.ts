import { computed, onScopeDispose, ref, watch } from "vue"

import {
  buildEntityDetailUrl,
  hasEntityDetailEndpoint,
} from "../../components/admin/entityDetail"
import { isRecordValue } from "../../components/admin/rawValue"
import { resolveRealtimeEntityName } from "../../components/admin/realtime"
import { getRecordId } from "../../components/admin/recordId"
import { useEntityRecordRealtime } from "../../components/admin/useEntityRecordRealtime"
import { useDetailApi } from "../../composables/api"

import { resolveConfig, resolveEntity } from "./instance"
import { createInstanceRegistry } from "./instanceRegistry"

import { useAdminPanelStore } from "./index"

import type { AdminInstanceParameters } from "./instance"
import type { ParsedEntity } from "./types"

/**
 * Detail slice of a keyed admin instance: view state, the single-record fetch
 * (dropdown from the OpenAPI detail endpoint) and the realtime detail channel.
 * Independent from the list/form slices, so a standalone detail with its own
 * key creates only this object.
 */
function createAdminPanelDetail(parameters: AdminInstanceParameters) {
  const adminPanelStore = useAdminPanelStore()

  function currentEntity(): ParsedEntity | undefined {
    return resolveEntity(parameters, () => adminPanelStore.activeEntity)
  }

  function currentConfig() {
    return resolveConfig(parameters, adminPanelStore.config)
  }

  const detail = useDetailApi<unknown>()
  const viewingRecord = ref<Record<string, unknown>>()

  const hasDetailEndpoint = computed(() =>
    hasEntityDetailEndpoint(currentEntity()),
  )

  const detailRecord = computed(() => detail.data.value ?? viewingRecord.value)

  function currentRealtimeEntityName(): string | undefined {
    return resolveRealtimeEntityName(
      currentEntity(),
      currentConfig()?.realtimeEntityName,
    )
  }

  const realtime = useEntityRecordRealtime({
    client: currentConfig()?.realtime,
    closeView,
    getEntityName: currentRealtimeEntityName,
    getViewedRecord: () => viewingRecord.value,
    list: false,
  })

  async function loadRecordDetail() {
    const entity = currentEntity()
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

  /** Merges a field-group change into the open record (optimistic UI). */
  function patchRecord(changed: Partial<Record<string, unknown>>) {
    if (viewingRecord.value !== undefined) {
      Object.assign(viewingRecord.value, changed)
    }
    if (isRecordValue(detail.data.value)) {
      Object.assign(detail.data.value, changed)
    }
  }

  // A realtime update to the viewed record refetches it.
  watch(realtime.detailRefreshSignal, () => {
    loadRecordDetail()
  })

  // Leaving the entity (inside the admin) closes any open record.
  watch(
    () => currentEntity()?.fullBasePath,
    () => closeView(),
  )

  onScopeDispose(realtime.dispose)

  return {
    closeView,
    detailRecord,
    detailStatus: detail.fetchDataStatus,
    hasDetailEndpoint,
    loadRecordDetail,
    patchRecord,
    startView,
    viewingRecord,
  }
}

type AdminPanelDetailStore = ReturnType<typeof createAdminPanelDetail>

const detailRegistry = createInstanceRegistry<
  AdminInstanceParameters,
  AdminPanelDetailStore
>({
  idPrefix: "admin-detail",
  setup: createAdminPanelDetail,
})

/** Returns (creating on first use) the detail store for the instance key. */
function useAdminPanelDetailStore(
  parameters: AdminInstanceParameters,
): AdminPanelDetailStore {
  return detailRegistry.use(parameters)
}

/** Returns an already-created detail store, or `undefined`. */
function getAdminPanelDetailStore(
  instanceKey: string | undefined,
): AdminPanelDetailStore | undefined {
  return detailRegistry.get(instanceKey)
}

export {
  createAdminPanelDetail,
  getAdminPanelDetailStore,
  useAdminPanelDetailStore,
}
export type { AdminPanelDetailStore }
