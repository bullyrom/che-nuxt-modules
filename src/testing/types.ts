/** Minimal click options forwarded to a locator. */
interface ClickOptions {
  force?: boolean
  position?: { x: number; y: number }
}

/** Minimal wait options forwarded to a locator. */
interface WaitForOptions {
  state?: "attached" | "detached" | "hidden" | "visible"
  timeout?: number
}

/** Locator subset required by BaseTest. */
interface LocatorLike {
  click(options?: ClickOptions): Promise<void>
  fill(value: string): Promise<void>
  isVisible(): Promise<boolean>
  scrollIntoViewIfNeeded(): Promise<void>
  textContent(): Promise<null | string>
  waitFor(options?: WaitForOptions): Promise<void>
}

/** Page subset required by BaseTest. */
interface PageLike {
  goto(url: string): Promise<unknown>
  locator(selector: string): LocatorLike
}

/** BaseTest configuration. */
interface BaseTestOptions {
  testIdAttribute?: string
}

export type {
  BaseTestOptions,
  ClickOptions,
  LocatorLike,
  PageLike,
  WaitForOptions,
}
