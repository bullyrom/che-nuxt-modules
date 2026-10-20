import type { FakeElement } from "./fakeDom"
import type { LocatorLike } from "../src/testing/types"

/** Locator over a fixed list of fake DOM elements. */
class FakeLocator implements LocatorLike {
  private readonly elements: FakeElement[]
  private readonly index: number
  private readonly onScroll?: () => void

  constructor(elements: FakeElement[], index = 0, onScroll?: () => void) {
    this.elements = elements
    this.index = index
    this.onScroll = onScroll
  }

  public click(): Promise<void> {
    this.getElement().clicked = true
    return Promise.resolve()
  }

  public count(): Promise<number> {
    return Promise.resolve(this.elements.length)
  }

  public dragTo(target: LocatorLike): Promise<void> {
    if (!(target instanceof FakeLocator)) {
      return Promise.reject(
        new TypeError("FakeLocator can only drag to another FakeLocator"),
      )
    }
    this.getElement().draggedTo = target.getElement()
    return Promise.resolve()
  }

  public first(): LocatorLike {
    return new FakeLocator(this.elements, 0, this.onScroll)
  }

  /** Returns the element addressed by the current index. */
  public getElement(): FakeElement {
    const element = this.elements[this.index]
    if (!element) throw new Error("Fake element not found")
    return element
  }

  public last(): LocatorLike {
    return new FakeLocator(
      this.elements,
      this.elements.length - 1,
      this.onScroll,
    )
  }

  public locator(selector: string): LocatorLike {
    return new FakeLocator(this.getElement().children.get(selector) ?? [])
  }

  public nth(index: number): LocatorLike {
    return new FakeLocator(this.elements, index, this.onScroll)
  }

  public scrollIntoViewIfNeeded(): Promise<void> {
    this.getElement().scrolled = true
    this.onScroll?.()
    return Promise.resolve()
  }

  public textContent(): Promise<null | string> {
    return Promise.resolve(this.getElement().text)
  }
}

export { FakeLocator }
