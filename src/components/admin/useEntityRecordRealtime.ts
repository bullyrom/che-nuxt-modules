import { ref } from "vue"

import {
  entityDetailChannel,
  entityListChannel,
  getAdminRealtime,
} from "./realtime"
import { getRecordId } from "./recordId"

import type { AdminRealtimeChange, AdminRealtimeClient } from "./realtime"

interface UseEntityRecordRealtimeParameters {
  client?: AdminRealtimeClient
  closeView: () => void
  /** Track the viewed-record channel and refetch it (default `true`). */
  detail?: boolean
  getEntityName: () => string | undefined
  getViewedRecord: () => Record<string, unknown> | undefined
  /** Track the list channel and count changes (default `true`). */
  list?: boolean
}

/**
 * Wires an admin area to the injected realtime client. The list follows
 * `entity:<model>` and only counts new changes (the UI prompts a manual,
 * filter-preserving reload), while the open record follows
 * `entity:<model>:<id>` and refetches on change. Channels are reference-counted
 * by the shared pool, so several panels viewing the same entity share one
 * subscription, and are released when `dispose` is called.
 *
 * `list`/`detail` let the split list and detail stores use the same helper for
 * only the channel they own.
 */
function useEntityRecordRealtime(
  parameters: UseEntityRecordRealtimeParameters,
) {
  // Realtime only exists in the browser: the socket, the subscriptions and the
  // change-driven refetch must never run during SSR, otherwise the admin fetches
  // with an incomplete base path and the server/client markup diverges.
  // `typeof window` is used instead of `import.meta.client` because the latter
  // is not rewritten inside a pre-built package consumed from node_modules.
  const isClient = globalThis.window !== undefined
  const realtime = isClient ? getAdminRealtime(parameters.client) : undefined

  const listEnabled = parameters.list ?? true
  const detailEnabled = parameters.detail ?? true

  const detailRefreshSignal = ref(0)
  const listChangesCount = ref(0)

  // eslint-disable-next-line init-declarations
  let activeListChannel: string | undefined
  // eslint-disable-next-line init-declarations
  let activeDetailChannel: string | undefined

  function releaseChannel(channel: string | undefined) {
    if (channel !== undefined) realtime?.release([channel])
  }

  function setListChannel(entityName: string | undefined) {
    if (!isClient || !listEnabled) return
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
    if (!isClient || !detailEnabled) return
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

    // The list does not refetch by itself (that would drop the user's filters
    // and flash the panel); it only accumulates a "new changes" badge.
    if (listEnabled && activeListChannel !== undefined) {
      listChangesCount.value += 1
    }

    if (!detailEnabled) return

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

  /** Clears the badge once the list is reloaded with the user's filters. */
  function resetListChanges() {
    listChangesCount.value = 0
  }

  function dispose() {
    detachListener?.()
    if (listEnabled) setListChannel(undefined)
    if (detailEnabled) setDetailChannel(undefined, undefined)
  }

  return {
    detailRefreshSignal,
    dispose,
    listChangesCount,
    resetListChanges,
    setDetailChannel,
    setListChannel,
  }
}

export { useEntityRecordRealtime }
export type { UseEntityRecordRealtimeParameters }
