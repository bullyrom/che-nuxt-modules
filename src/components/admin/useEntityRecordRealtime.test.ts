import { afterEach, describe, expect, it, vi } from "vitest"

import { useEntityRecordRealtime } from "./useEntityRecordRealtime"

import type {
  AdminRealtimeChange,
  AdminRealtimeClient,
  AdminRealtimeHandler,
} from "./realtime"

const ENTITY = "record.recordproject"
const RECORD_ID = 7

function createClient() {
  const handlers: AdminRealtimeHandler[] = []

  const client: AdminRealtimeClient = {
    onChanged: vi.fn((handler: AdminRealtimeHandler) => {
      handlers.push(handler)
    }),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }

  function emit(change: AdminRealtimeChange) {
    for (const handler of handlers) handler(change)
  }

  return { client, emit }
}

describe("useEntityRecordRealtime", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("counts list changes and refetches the viewed record", () => {
    vi.stubGlobal("window", {})
    const { client, emit } = createClient()
    const closeView = vi.fn()

    const realtime = useEntityRecordRealtime({
      client,
      closeView,
      getEntityName: () => ENTITY,
      getViewedRecord: () => ({ id: RECORD_ID }),
    })

    realtime.setListChannel(ENTITY)
    realtime.setDetailChannel(ENTITY, RECORD_ID)

    emit({ action: "updated", entity: ENTITY, id: RECORD_ID })

    expect(client.subscribe).toHaveBeenCalledWith([`entity:${ENTITY}`])
    expect(realtime.listChangesCount.value).toBe(1)
    expect(realtime.detailRefreshSignal.value).toBe(1)
    expect(closeView).not.toHaveBeenCalled()

    realtime.resetListChanges()
    expect(realtime.listChangesCount.value).toBe(0)

    emit({ action: "deleted", entity: ENTITY, id: RECORD_ID })
    expect(closeView).toHaveBeenCalledTimes(1)
  })

  it("ignores changes for another entity", () => {
    vi.stubGlobal("window", {})
    const { client, emit } = createClient()

    const realtime = useEntityRecordRealtime({
      client,
      closeView: vi.fn(),
      getEntityName: () => ENTITY,
      getViewedRecord: () => undefined,
    })
    realtime.setListChannel(ENTITY)

    emit({ action: "created", entity: "other.model", id: 1 })

    expect(realtime.listChangesCount.value).toBe(0)
  })

  it("does nothing without a browser environment", () => {
    const { client } = createClient()

    const realtime = useEntityRecordRealtime({
      client,
      closeView: vi.fn(),
      getEntityName: () => ENTITY,
      getViewedRecord: () => undefined,
    })
    realtime.setListChannel(ENTITY)

    expect(client.subscribe).not.toHaveBeenCalled()
    expect(realtime.listChangesCount.value).toBe(0)
  })
})
