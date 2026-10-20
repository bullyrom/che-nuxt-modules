import type { FakeElement } from "./fakeDom"
import type { LocatorLike } from "../src/testing/types"

/** Locator over a fixed list of fake DOM elements. */
class FakeLocator implements LocatorLike {
  private readonly elements: FakeElement[]
  private readonly index: number

  constructor(elements: FakeElement[], index = 0) {
    this.elements = elements
    this.index = index
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

  public fill(value: string): Promise<void> {
    this.getElement().value = value
    return Promise.resolve()
  }

  /** Returns the element addressed by the current index. */
  public getElement(): FakeElement {
    const element = this.elements[this.index]
    if (!element) throw new Error("Fake element not found")
    return element
  }

  public hover(): Promise<void> {
    this.getElement().hovered = true
    return Promise.resolve()
  }

  public isVisible(): Promise<boolean> {
    return Promise.resolve(this.getElement().visible)
  }

  public nth(index: number): LocatorLike {
    return new FakeLocator(this.elements, index)
  }

  public press(key: string): Promise<void> {
    this.getElement().pressedKey = key
    return Promise.resolve()
  }

  public scrollIntoViewIfNeeded(): Promise<void> {
    this.getElement().scrolled = true
    return Promise.resolve()
  }

  public selectOption(values: string | string[]): Promise<string[]> {
    const selectedValues = Array.isArray(values) ? values : [values]
    this.getElement().selectedValues = selectedValues
    return Promise.resolve(selectedValues)
  }

  public textContent(): Promise<null | string> {
    return Promise.resolve(this.getElement().text)
  }

  public waitFor(): Promise<void> {
    this.getElement().waited = true
    return Promise.resolve()
  }
}

export { FakeLocator }
