import type { ParsedEntity } from "../../stores/adminPanel/types"

/** Action carried by a realtime `changed` event. */
type AdminRealtimeAction = "created" | "deleted" | "updated"

/** Thin payload describing a single changed record. */
interface AdminRealtimeChange {
  action: AdminRealtimeAction
  entity: string
  id?: number | string
}

/** Handler invoked for every realtime change. */
type AdminRealtimeHandler = (change: AdminRealtimeChange) => void

/**
 * Structural realtime client injected by the host app. The library never
 * imports a socket implementation — it only needs these three methods.
 */
interface AdminRealtimeClient {
  onChanged(handler: AdminRealtimeHandler): void
  subscribe(channels: string[]): void
  unsubscribe(channels: string[]): void
}

/**
 * Ref-counted subscription pool shared by every consumer of one client:
 * registering change handlers is fanned out locally and channels are
 * subscribed once for the first consumer, unsubscribed for the last.
 */
interface AdminRealtimeSubscriptions {
  onChange(handler: AdminRealtimeHandler): () => void
  release(channels: string[]): void
  retain(channels: string[]): void
}

const LIST_CHANNEL_PREFIX = "entity:"

/** Room for every list of a model, e.g. `entity:categories`. */
function entityListChannel(entityName: string): string {
  return `${LIST_CHANNEL_PREFIX}${entityName}`
}

/** Room for one record of a model, e.g. `entity:categories:42`. */
function entityDetailChannel(entityName: string, id: number | string): string {
  return `${entityListChannel(entityName)}:${id}`
}

/**
 * Maps a parsed OpenAPI entity to the identifier the backend uses in realtime
 * rooms (`model._meta.label_lower`, e.g. `record.recordproject`).
 */
type AdminRealtimeEntityName = (entity: ParsedEntity) => string

/**
 * Resolves the realtime room identifier for an entity: the host-provided
 * resolver (backend model label) when present, otherwise the URL-derived
 * `entity.entityName`.
 */
function resolveRealtimeEntityName(
  entity: ParsedEntity | undefined,
  resolve?: AdminRealtimeEntityName,
): string | undefined {
  if (entity === undefined) return undefined
  return resolve?.(entity) ?? entity.entityName
}

/**
 * Creates a subscription pool for one client. Channels are reference-counted
 * so the client is called with `subscribe`/`unsubscribe` only on the first and
 * last consumer of each channel; a single `onChanged` listener fans the
 * changes out to the locally registered handlers.
 */
function createRealtimeSubscriptions(
  client: AdminRealtimeClient,
): AdminRealtimeSubscriptions {
  const counts = new Map<string, number>()
  const handlers = new Set<AdminRealtimeHandler>()
  let isListening = false

  function ensureListening() {
    if (isListening) return
    isListening = true
    client.onChanged((change) => {
      for (const handler of handlers) handler(change)
    })
  }

  function retain(channels: string[]) {
    ensureListening()
    const activated: string[] = []
    for (const channel of channels) {
      const nextCount = (counts.get(channel) ?? 0) + 1
      counts.set(channel, nextCount)
      if (nextCount === 1) activated.push(channel)
    }
    if (activated.length > 0) client.subscribe(activated)
  }

  function release(channels: string[]) {
    const deactivated: string[] = []
    for (const channel of channels) {
      const currentCount = counts.get(channel) ?? 0
      if (currentCount > 1) {
        counts.set(channel, currentCount - 1)
      } else if (currentCount === 1) {
        counts.delete(channel)
        deactivated.push(channel)
      }
    }
    if (deactivated.length > 0) client.unsubscribe(deactivated)
  }

  function onChange(handler: AdminRealtimeHandler) {
    ensureListening()
    handlers.add(handler)
    return () => {
      handlers.delete(handler)
    }
  }

  return { onChange, release, retain }
}

const subscriptionsByClient = new WeakMap<
  AdminRealtimeClient,
  AdminRealtimeSubscriptions
>()

/**
 * Returns the pool shared by every consumer of the given client, creating it
 * on first use; `undefined` when no client was injected.
 */
function getAdminRealtime(
  client: AdminRealtimeClient | undefined,
): AdminRealtimeSubscriptions | undefined {
  if (client === undefined) return undefined

  const existing = subscriptionsByClient.get(client)
  if (existing !== undefined) return existing

  const subscriptions = createRealtimeSubscriptions(client)
  subscriptionsByClient.set(client, subscriptions)
  return subscriptions
}

export {
  createRealtimeSubscriptions,
  entityDetailChannel,
  entityListChannel,
  getAdminRealtime,
  resolveRealtimeEntityName,
}
export type {
  AdminRealtimeAction,
  AdminRealtimeChange,
  AdminRealtimeClient,
  AdminRealtimeEntityName,
  AdminRealtimeHandler,
  AdminRealtimeSubscriptions,
}
