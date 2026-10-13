import debounce from "lodash-es/debounce"
import { ref } from "vue"

import {
  entityDetailChannel,
  entityListChannel,
  getAdminRealtime,
} from "./realtime"
import { getRecordId } from "./recordId"

import type { AdminRealtimeChange, AdminRealtimeClient } from "./realtime"

const REALTIME_RELOAD_DEBOUNCE_MS = 150

interface UseEntityRecordRealtimeParameters {
  client?: AdminRealtimeClient
  closeView: () => void
  getEntityName: () => string | undefined
  getViewedRecord: () => Record<string, unknown> | undefined
  reload: () => void
}

/**
 * Wires the admin record list to the injected realtime client: the list follows
 * `entity:<model>`, the open record `entity:<model>:<id>`. Channels are
 * reference-counted by the shared pool, so several panels viewing the same
 * entity share one subscription, and are released when `dispose` is called.
 */
function useEntityRecordRealtime(
  parameters: UseEntityRecordRealtimeParameters,
) {
  // Realtime only exists in the browser: the socket, the subscriptions and the
  // change-driven refetch must never run during SSR, otherwise the admin fetches
  // with an incomplete base path and the server/client markup diverges.
  const isClient = import.meta.client
  const realtime = isClient ? getAdminRealtime(parameters.client) : undefined

  const detailRefreshSignal = ref(0)

  // eslint-disable-next-line init-declarations
  let activeListChannel: string | undefined
  // eslint-disable-next-line init-declarations
  let activeDetailChannel: string | undefined

  const reloadDebounced = debounce(() => {
    parameters.reload()
  }, REALTIME_RELOAD_DEBOUNCE_MS)

  function releaseChannel(channel: string | undefined) {
    if (channel !== undefined) realtime?.release([channel])
  }

  function setListChannel(entityName: string | undefined) {
    if (!isClient) return
    const nextChannel =
      entityName === undefined ? undefined : entityListChannel(entityName)
    if (nextChannel === activeListChannel) return
    releaseChannel(activeListChannel)
    activeListChannel = nextChannel
    if (nextChannel !== undefined) realtime?.retain([nextChannel])
  }

  function setDetailChannel(
    entityName: string | undefined,
    recordId: number | string | undefined,
  ) {
    if (!isClient) return
    const nextChannel =
      entityName === undefined || recordId === undefined
        ? undefined
        : entityDetailChannel(entityName, recordId)
    if (nextChannel === activeDetailChannel) return
    releaseChannel(activeDetailChannel)
    activeDetailChannel = nextChannel
    if (nextChannel !== undefined) realtime?.retain([nextChannel])
  }

  function handleChange(change: AdminRealtimeChange) {
    const entityName = parameters.getEntityName()
    if (entityName === undefined || change.entity !== entityName) return

    if (activeListChannel !== undefined) reloadDebounced()

    const viewedRecord = parameters.getViewedRecord()
    const viewedRecordId =
      viewedRecord === undefined ? undefined : getRecordId(viewedRecord)
    const isViewedRecordChange =
      activeDetailChannel !== undefined &&
      change.id !== undefined &&
      viewedRecordId !== undefined &&
      String(change.id) === String(viewedRecordId)

    if (!isViewedRecordChange) return

    if (change.action === "deleted") {
      parameters.closeView()
    } else {
      detailRefreshSignal.value += 1
    }
  }

  const detachListener = realtime?.onChange(handleChange)

  function dispose() {
    detachListener?.()
    reloadDebounced.cancel()
    setListChannel(undefined)
    setDetailChannel(undefined, undefined)
  }

  return { detailRefreshSignal, dispose, setDetailChannel, setListChannel }
}

export { useEntityRecordRealtime }
export type { UseEntityRecordRealtimeParameters }
