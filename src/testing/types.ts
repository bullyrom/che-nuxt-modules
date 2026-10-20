/** Minimal click options forwarded to a locator. */
interface ClickOptions {
  force?: boolean
}

/** Minimal drag options forwarded to a locator. */
interface DragToOptions {
  force?: boolean
}

/** Locator subset required by BaseTest. */
interface LocatorLike {
  click(options?: ClickOptions): Promise<void>
  count(): Promise<number>
  dragTo(target: LocatorLike, options?: DragToOptions): Promise<void>
  first(): LocatorLike
  last(): LocatorLike
  locator(selector: string): LocatorLike
  nth(index: number): LocatorLike
  scrollIntoViewIfNeeded(): Promise<void>
  textContent(): Promise<null | string>
}

/** Page subset required by BaseTest. */
interface PageLike {
  goto(url: string): Promise<unknown>
  locator(selector: string): LocatorLike
  waitForTimeout?(milliseconds: number): Promise<void>
}

/** BaseTest configuration. Replaces dotenv-driven URLs and Nuxt 2 roots. */
interface BaseTestOptions {
  basePath?: string
  baseUrl?: string
  filterDelayMs?: number
  lazyLoadDelayMs?: number
  pageRootSelector?: string
  selectSelector?: string
}

export type {
  BaseTestOptions,
  ClickOptions,
  DragToOptions,
  LocatorLike,
  PageLike,
}
