/** Mutable state of a fake DOM element. */
interface FakeElement {
  children: Map<string, FakeElement[]>
  clicked: boolean
  draggedTo?: FakeElement
  scrolled: boolean
  text: string
  visible: boolean
}

/** Creates a fake DOM element with sensible defaults. */
function createElement(overrides: Partial<FakeElement> = {}): FakeElement {
  return {
    children: new Map(),
    clicked: false,
    scrolled: false,
    text: "",
    visible: true,
    ...overrides,
  }
}

/** Registers child elements for a selector on a fake element. */
function setChildren(
  parent: FakeElement,
  selector: string,
  ...children: FakeElement[]
): void {
  parent.children.set(selector, children)
}

export { createElement, setChildren }
export type { FakeElement }
