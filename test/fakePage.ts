import { FakeLocator } from "./fakeLocator"

import type { FakeElement } from "./fakeDom"
import type { LocatorLike, PageLike } from "../src/testing/types"

/** Page-like object backed by a selector-to-elements registry. */
class FakePage implements PageLike {
  public readonly scrollHandlers = new Map<string, () => void>()
  public readonly visitedUrls: string[] = []
  public readonly waitForTimeouts: number[] = []
  private readonly elements = new Map<string, FakeElement[]>()

  public goto(url: string): Promise<void> {
    this.visitedUrls.push(url)
    return Promise.resolve()
  }

  public locator(selector: string): LocatorLike {
    return new FakeLocator(
      this.elements.get(selector) ?? [],
      0,
      this.scrollHandlers.get(selector),
    )
  }

  /** Registers a callback fired when an element of the selector scrolls. */
  public onScroll(selector: string, handler: () => void): void {
    this.scrollHandlers.set(selector, handler)
  }

  /** Registers elements for a selector. */
  public set(selector: string, ...elements: FakeElement[]): void {
    this.elements.set(selector, elements)
  }

  public waitForTimeout(milliseconds: number): Promise<void> {
    this.waitForTimeouts.push(milliseconds)
    return Promise.resolve()
  }
}

export { FakePage }
