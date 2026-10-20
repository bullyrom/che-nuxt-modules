/** A point in page coordinates. */
interface Point {
  x: number
  y: number
}

/** An element target: a CSS selector or an existing locator. */
type Target = LocatorLike | string

/** An element target or a point for coordinate-based dragging. */
type DragTarget = Point | Target

/** Minimal mouse API used for coordinate-based dragging. */
interface MouseLike {
  down(): Promise<void>
  move(x: number, y: number): Promise<void>
  up(): Promise<void>
}

/** Minimal click options forwarded to a locator. */
interface ClickOptions {
  force?: boolean
  position?: Point
}

/** Minimal hover options forwarded to a locator. */
interface HoverOptions {
  force?: boolean
  position?: Point
}

/** Minimal wait options forwarded to a locator. */
interface WaitForOptions {
  state?: "attached" | "detached" | "hidden" | "visible"
  timeout?: number
}

/** Minimal press options forwarded to a locator. */
interface PressOptions {
  delay?: number
}

/** Minimal select options forwarded to a locator. */
interface SelectOptionOptions {
  force?: boolean
}

/** Minimal drag options forwarded to a locator. */
interface DragToOptions {
  force?: boolean
  sourcePosition?: Point
  targetPosition?: Point
}

/** Locator subset required by BaseTest. */
interface LocatorLike {
  click(options?: ClickOptions): Promise<void>
  count(): Promise<number>
  dragTo(target: LocatorLike, options?: DragToOptions): Promise<void>
  fill(value: string): Promise<void>
  hover(options?: HoverOptions): Promise<void>
  isVisible(): Promise<boolean>
  nth(index: number): LocatorLike
  press(key: string, options?: PressOptions): Promise<void>
  scrollIntoViewIfNeeded(): Promise<void>
  selectOption(
    values: string | string[],
    options?: SelectOptionOptions,
  ): Promise<string[]>
  textContent(): Promise<null | string>
  waitFor(options?: WaitForOptions): Promise<void>
}

/** Page subset required by BaseTest. */
interface PageLike {
  goto(url: string): Promise<unknown>
  locator(selector: string): LocatorLike
  mouse?: MouseLike
}

export type {
  ClickOptions,
  DragTarget,
  DragToOptions,
  HoverOptions,
  LocatorLike,
  MouseLike,
  PageLike,
  Point,
  PressOptions,
  SelectOptionOptions,
  Target,
  WaitForOptions,
}
