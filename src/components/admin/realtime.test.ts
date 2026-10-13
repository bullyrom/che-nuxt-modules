import { describe, expect, it, vi } from "vitest"

import {
  createRealtimeSubscriptions,
  entityDetailChannel,
  entityListChannel,
  getAdminRealtime,
  resolveRealtimeEntityName,
} from "./realtime"
import { getRecordId } from "./recordId"

import type {
  AdminRealtimeChange,
  AdminRealtimeClient,
  AdminRealtimeHandler,
} from "./realtime"
import type { ParsedEntity } from "../../stores/adminPanel/types"

const RECORD_ID = 42

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

describe("realtime channel names", () => {
  it("builds the list and detail rooms", () => {
    expect(entityListChannel("categories")).toBe("entity:categories")
    expect(entityDetailChannel("categories", RECORD_ID)).toBe(
      "entity:categories:42",
    )
  })
})

describe("createRealtimeSubscriptions", () => {
  it("subscribes once per channel, even for repeated retains", () => {
    const { client } = createClient()
    const subscriptions = createRealtimeSubscriptions(client)

    subscriptions.retain(["entity:categories"])
    subscriptions.retain(["entity:categories"])

    expect(client.subscribe).toHaveBeenCalledTimes(1)
    expect(client.subscribe).toHaveBeenCalledWith(["entity:categories"])
  })

  it("unsubscribes only when the last consumer releases the channel", () => {
    const { client } = createClient()
    const subscriptions = createRealtimeSubscriptions(client)

    subscriptions.retain(["entity:categories"])
    subscriptions.retain(["entity:categories"])
    subscriptions.release(["entity:categories"])

    expect(client.unsubscribe).not.toHaveBeenCalled()

    subscriptions.release(["entity:categories"])
    expect(client.unsubscribe).toHaveBeenCalledTimes(1)
    expect(client.unsubscribe).toHaveBeenCalledWith(["entity:categories"])
  })

  it("releases channels it does not track without touching the client", () => {
    const { client } = createClient()
    const subscriptions = createRealtimeSubscriptions(client)

    subscriptions.release(["entity:unknown"])

    expect(client.unsubscribe).not.toHaveBeenCalled()
  })

  it("fans changes out to every handler and stops after dispose", () => {
    const { client, emit } = createClient()
    const subscriptions = createRealtimeSubscriptions(client)
    const first = vi.fn()
    const second = vi.fn()
    const detachFirst = subscriptions.onChange(first)

    subscriptions.onChange(second)
    emit({ action: "updated", entity: "categories", id: 1 })

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)

    detachFirst()
    emit({ action: "deleted", entity: "categories", id: 1 })

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(2)
  })

  it("registers a single client listener", () => {
    const { client } = createClient()
    const subscriptions = createRealtimeSubscriptions(client)

    subscriptions.onChange(vi.fn())
    subscriptions.onChange(vi.fn())
    subscriptions.retain(["entity:categories"])

    expect(client.onChanged).toHaveBeenCalledTimes(1)
  })
})

describe("getAdminRealtime", () => {
  it("returns the same pool for the same client", () => {
    const { client } = createClient()

    expect(getAdminRealtime(client)).toBe(getAdminRealtime(client))
  })

  it("returns undefined without a client", () => {
    expect(getAdminRealtime(undefined)).toBeUndefined()
  })
})

describe("getRecordId", () => {
  it("prefers id and falls back to Django pk", () => {
    expect(getRecordId({ id: 1 })).toBe(1)
    expect(getRecordId({ pk: "abc" })).toBe("abc")
    expect(getRecordId({ id: 1, pk: 2 })).toBe(1)
  })

  it("ignores records without a usable identifier", () => {
    expect(getRecordId({})).toBeUndefined()
    expect(getRecordId({ id: { nested: true } })).toBeUndefined()
  })
})

describe("resolveRealtimeEntityName", () => {
  const entity: ParsedEntity = {
    basePath: "/record-projects/",
    details: [],
    entityName: "record-projects",
    fullBasePath: "/api/v1/record-projects/",
    methods: [],
    namespace: "record",
  }

  it("defaults to the URL-derived entity name", () => {
    expect(resolveRealtimeEntityName(entity)).toBe("record-projects")
  })

  it("uses the host resolver for the backend model label", () => {
    expect(
      resolveRealtimeEntityName(entity, () => "record.recordproject"),
    ).toBe("record.recordproject")
  })

  it("returns undefined without an entity", () => {
    expect(resolveRealtimeEntityName(undefined)).toBeUndefined()
  })
})
