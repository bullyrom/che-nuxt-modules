import { FakeLocator } from "./fakeLocator"

import type { FakeElement } from "./fakeDom"
import type { LocatorLike, MouseLike, PageLike } from "../src/testing/types"

/** A recorded mouse action. */
interface FakeMouseAction {
  positionX?: number
  positionY?: number
  type: "down" | "move" | "up"
}

/** Page-like object backed by a selector-to-elements registry. */
class FakePage implements PageLike {
  public readonly mouse: MouseLike
  public readonly mouseActions: FakeMouseAction[] = []
  public readonly visitedUrls: string[] = []
  private readonly elements = new Map<string, FakeElement[]>()

  constructor() {
    this.mouse = {
      down: () => {
        this.mouseActions.push({ type: "down" })
        return Promise.resolve()
      },
      move: (positionX, positionY) => {
        this.mouseActions.push({ positionX, positionY, type: "move" })
        return Promise.resolve()
      },
      up: () => {
        this.mouseActions.push({ type: "up" })
        return Promise.resolve()
      },
    }
  }

  public goto(url: string): Promise<void> {
    this.visitedUrls.push(url)
    return Promise.resolve()
  }

  public locator(selector: string): LocatorLike {
    return new FakeLocator(this.elements.get(selector) ?? [])
  }

  /** Registers elements for a selector. */
  public set(selector: string, ...elements: FakeElement[]): void {
    this.elements.set(selector, elements)
  }
}

export { FakePage }
export type { FakeMouseAction }
