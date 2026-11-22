import type { Page, WebSocketRoute } from "@playwright/test"

/**
 * Minimal socket.io v4 server mock for the admin realtime channel. The host app
 * opens a socket only when its public `realtimeUrl` is configured, so the route
 * handler is the e2e proof that the injected client is actually wired.
 */
const SOCKET_IO_ROUTE = /\/socket\.io\//v
const SOCKET_ID = "e2e-realtime"
const ENGINE_OPEN_PREFIX = "0"
const ENGINE_PING = "2"
const ENGINE_PONG = "3"
const SOCKET_CONNECT_PREFIX = "40"
const EVENT_PREFIX = "42"
const SUBSCRIBE_EVENT = "subscribe"
const CHANGED_EVENT = "changed"
const CREATED_ACTION = "created"

interface SocketIoEvent {
  name: string
  payload: Record<string, unknown> | undefined
}

const ENGINE_OPEN_MESSAGE =
  ENGINE_OPEN_PREFIX +
  JSON.stringify({
    maxPayload: 1_000_000,
    pingInterval: 25_000,
    pingTimeout: 20_000,
    sid: SOCKET_ID,
    upgrades: [],
  })

const SOCKET_CONNECT_MESSAGE =
  SOCKET_CONNECT_PREFIX + JSON.stringify({ sid: SOCKET_ID })

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Parses a socket.io event packet, ignoring engine and connect packets. */
function parseSocketIoEvent(message: string): SocketIoEvent | undefined {
  if (!message.startsWith(EVENT_PREFIX)) return undefined
  const decoded: unknown = JSON.parse(message.slice(EVENT_PREFIX.length))
  if (!Array.isArray(decoded)) return undefined
  const [name, payload] = decoded as [unknown, unknown]
  if (typeof name !== "string") return undefined
  return { name, payload: isRecord(payload) ? payload : undefined }
}

/** Emits a `created` change once the page subscribes to the given entity. */
function emitCreatedChange(
  socket: WebSocketRoute,
  entity: string,
  recordId: number,
): void {
  const change = { action: CREATED_ACTION, entity, id: recordId }
  socket.send(EVENT_PREFIX + JSON.stringify([CHANGED_EVENT, change]))
}

/**
 * Replaces the host app's socket.io connection with a deterministic server that
 * answers the handshake, records the subscription and emits one `created`
 * event for the requested entity.
 */
async function mockRealtimeSocket(
  page: Page,
  entity: string,
  recordId: number,
): Promise<void> {
  await page.routeWebSocket(SOCKET_IO_ROUTE, (socket) => {
    let isConnected = false
    let queuedChange = false

    socket.onMessage((rawMessage) => {
      const message = rawMessage.toString()

      if (message === ENGINE_PING) {
        socket.send(ENGINE_PONG)
        return
      }

      if (message.startsWith(SOCKET_CONNECT_PREFIX)) {
        isConnected = true
        socket.send(SOCKET_CONNECT_MESSAGE)
        if (queuedChange) {
          queuedChange = false
          emitCreatedChange(socket, entity, recordId)
        }
        return
      }

      const event = parseSocketIoEvent(message)
      if (event?.name !== SUBSCRIBE_EVENT || event.payload?.entity !== entity)
        return

      if (isConnected) {
        emitCreatedChange(socket, entity, recordId)
      } else {
        queuedChange = true
      }
    })

    socket.send(ENGINE_OPEN_MESSAGE)
  })
}

export { mockRealtimeSocket }
