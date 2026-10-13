import { useAdminPanelRecordsStore } from "../../stores/adminPanel/records"

import type { RequestStatus } from "../../types"
import type { Ref } from "vue"

interface UseEntityRecordListStateParameters<RawData> {
  entityPath: () => string | undefined
  nextPageUrl: Ref<null | string | undefined>
  previousPageUrl: Ref<null | string | undefined>
  rawData: Ref<RawData | undefined>
  records: Ref<Record<string, unknown>[] | undefined>
  status: Ref<RequestStatus>
}

/**
 * Persists the admin list paginated state in a Pinia store (so the Nuxt payload
 * hydrates it) and restores it during setup, before the first render. Without
 * this the server-rendered list would be missing on the client and get cleared
 * and refetched, causing a loading flash and a hydration mismatch.
 */
function useEntityRecordListState<RawData>(
  parameters: UseEntityRecordListStateParameters<RawData>,
) {
  const store = useAdminPanelRecordsStore()

  function save() {
    store.capture({
      entityPath: parameters.entityPath(),
      nextPageUrl: parameters.nextPageUrl.value,
      previousPageUrl: parameters.previousPageUrl.value,
      rawData: parameters.rawData.value,
      records: parameters.records.value,
      status: parameters.status.value,
    })
  }

  function restore() {
    const snapshot = store.restore(parameters.entityPath())
    if (snapshot === undefined) return

    parameters.nextPageUrl.value = snapshot.nextPageUrl
    parameters.previousPageUrl.value = snapshot.previousPageUrl
    parameters.rawData.value = snapshot.rawData as RawData | undefined
    parameters.records.value = snapshot.records
    parameters.status.value = snapshot.status
  }

  restore()

  return { save }
}

export { useEntityRecordListState }
export type { UseEntityRecordListStateParameters }
