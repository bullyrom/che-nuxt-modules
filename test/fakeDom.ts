import type { Point } from "../src/testing/types"

/** Mutable state of a fake DOM element. */
interface FakeElement {
  clicked: boolean
  draggedTo?: FakeElement
  hovered: boolean
  pressedKey?: string
  scrolled: boolean
  selectedValues: string[]
  text: string
  value: string
  visible: boolean
  waited: boolean
}

/** Creates a fake DOM element with sensible defaults. */
function createElement(overrides: Partial<FakeElement> = {}): FakeElement {
  return {
    clicked: false,
    hovered: false,
    scrolled: false,
    selectedValues: [],
    text: "",
    value: "",
    visible: true,
    waited: false,
    ...overrides,
  }
}

/** Creates a point from full-length coordinate names. */
function createPoint(positionX: number, positionY: number): Point {
  // eslint-disable-next-line id-length
  return { x: positionX, y: positionY }
}

export { createElement, createPoint }
export type { FakeElement }
