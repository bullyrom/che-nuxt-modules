import { createPinia, setActivePinia } from "pinia"
import { createApp, nextTick } from "vue"

import type { Pinia } from "pinia"
import type { App, Component, ComponentPublicInstance } from "vue"

const FLUSH_TICKS = 4
const DEFAULT_WAIT_TIMEOUT_MS = 1500
const WAIT_INTERVAL_MS = 10

interface MountedComponent {
  app: App
  container: HTMLElement
  pinia: Pinia
  unmount: () => void
}

/** Creates and activates a fresh Pinia, isolating every test. */
function createTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/** Flushes Vue's scheduler and pending microtasks. */
async function flush(): Promise<void> {
  for (let tick = 0; tick < FLUSH_TICKS; tick += 1) {
    // eslint-disable-next-line no-await-in-loop
    await nextTick()
  }
  await Promise.resolve()
}

/** Mounts a public component into a fresh container with its own Pinia. */
async function mountComponent(
  component: Component,
  properties: Record<string, unknown> = {},
  pinia: Pinia = createTestPinia(),
): Promise<MountedComponent> {
  const container = document.createElement("div")
  document.body.append(container)

  const app = createApp(component, properties)
  app.use(pinia)
  app.mount(container)
  await flush()

  return {
    app,
    container,
    pinia,
    unmount: () => {
      app.unmount()
      container.remove()
    },
  }
}

/** Returns the public instance of the root component. */
function rootInstance(mounted: MountedComponent): ComponentPublicInstance {
  // eslint-disable-next-line no-underscore-dangle
  const instance = mounted.app._instance
  if (instance === null || instance === undefined) {
    throw new Error("The component was not mounted")
  }
  return instance.proxy as ComponentPublicInstance
}

/** Dispatches a bubbling click on the element when it exists. */
async function click(element: Element | null | undefined): Promise<void> {
  if (element === null || element === undefined) {
    throw new Error("Cannot click a missing element")
  }
  element.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  await flush()
}

/** Types into an input through the native `input` event. */
async function typeInto(
  element: Element | null,
  value: string,
): Promise<void> {
  if (!(element instanceof HTMLInputElement)) {
    throw new TypeError("Target is not an input")
  }
  element.value = value
  element.dispatchEvent(new Event("input", { bubbles: true }))
  await flush()
}

/** Polls a predicate until it passes or the timeout expires. */
async function waitFor(
  predicate: () => boolean,
  timeoutMs = DEFAULT_WAIT_TIMEOUT_MS,
): Promise<void> {
  const startedAt = Date.now()
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for the expected state")
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, WAIT_INTERVAL_MS)
    })
  }
  await flush()
}

export {
  click,
  createTestPinia,
  flush,
  mountComponent,
  rootInstance,
  typeInto,
  waitFor,
}
export type { MountedComponent }
