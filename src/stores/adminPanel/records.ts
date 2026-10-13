// eslint-disable-next-line import/no-unresolved
import { defineStore } from "pinia"
import { ref } from "vue"

import type { RequestStatus } from "../../types"

/** Snapshot of the admin entity list paginated state. */
interface AdminPanelRecordsSnapshot {
  entityPath: string | undefined
  nextPageUrl: null | string | undefined
  previousPageUrl: null | string | undefined
  rawData: unknown
  records: Record<string, unknown>[] | undefined
  status: RequestStatus
}

/**
 * SSR-hydrated list state of the OpenAPI admin. The list composable mirrors its
 * paginated state here so the server-rendered list survives hydration instead
 * of being cleared and refetched (which caused a loading flash and a hydration
 * mismatch).
 */
export const useAdminPanelRecordsStore = defineStore(
  "admin-panel-records",
  () => {
    const entityPath = ref<string>()
    const records = ref<Record<string, unknown>[]>()
    const status = ref<RequestStatus>("idle")
    const rawData = ref<unknown>()
    const nextPageUrl = ref<null | string>()
    const previousPageUrl = ref<null | string>()

    // Bumped on every sidebar selection so re-clicking the active entity can
    // close an open record view even though `activeEntity` is unchanged.
    const entitySelectionNonce = ref(0)

    function requestEntityViewReset() {
      entitySelectionNonce.value += 1
    }

    /** Stores the current list state for the nuxt payload. */
    function capture(snapshot: AdminPanelRecordsSnapshot) {
      entityPath.value = snapshot.entityPath
      nextPageUrl.value = snapshot.nextPageUrl
      previousPageUrl.value = snapshot.previousPageUrl
      rawData.value = snapshot.rawData
      records.value = snapshot.records
      status.value = snapshot.status
    }

    /** Returns the stored state when it belongs to the requested entity. */
    function restore(
      requestedEntityPath: string | undefined,
    ): AdminPanelRecordsSnapshot | undefined {
      if (
        requestedEntityPath === undefined ||
        requestedEntityPath !== entityPath.value ||
        records.value === undefined
      )
        return undefined

      return {
        entityPath: entityPath.value,
        nextPageUrl: nextPageUrl.value,
        previousPageUrl: previousPageUrl.value,
        rawData: rawData.value,
        records: records.value,
        status: status.value,
      }
    }

    return {
      capture,
      entityPath,
      entitySelectionNonce,
      nextPageUrl,
      previousPageUrl,
      rawData,
      records,
      requestEntityViewReset,
      restore,
      status,
    }
  },
)
