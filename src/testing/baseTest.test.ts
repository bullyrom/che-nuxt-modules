import { describe, expect, it } from "vitest"

import { createElement, createPoint } from "../../test/fakeDom"
import { FakePage } from "../../test/fakePage"

import { BaseTest } from "./baseTest"

const BUTTON = "#button"
const INPUT = "#input"
const LIST = "#list"
const SOURCE = "#source"
const TARGET = "#target"
const PAGE_URL = "https://example.test/path"
const BUTTON_TEXT = "Submit"
const FIRST_INDEX = 0
const ELEMENT_INDEX = 1
const START_X = 10
const START_Y = 20
const END_X = 30
const END_Y = 40
const START_POINT = createPoint(START_X, START_Y)
const END_POINT = createPoint(END_X, END_Y)

describe("BaseTest", () => {
  it("navigates and operates on real fake DOM elements", async () => {
    const page = new FakePage()
    const button = createElement({ text: BUTTON_TEXT })
    const input = createElement()
    page.set(BUTTON, button)
    page.set(INPUT, input)
    const baseTest = new BaseTest(page)

    await baseTest.goto(PAGE_URL)
    // eslint-disable-next-line unicorn/no-array-callback-reference
    const buttonLocator = baseTest.find(BUTTON)
    await expect(buttonLocator.count()).resolves.toBe(1)
    await baseTest.click(BUTTON)
    await baseTest.fill(INPUT, "hello")

    expect(page.visitedUrls).toEqual([PAGE_URL])
    expect(button.clicked).toBe(true)
    expect(input.value).toBe("hello")
    await expect(baseTest.text(BUTTON)).resolves.toBe(BUTTON_TEXT)
  })

  it("checks text presence and selectors against the fake DOM", async () => {
    const page = new FakePage()
    page.set("#root", createElement({ text: "Hello world" }))
    page.set(LIST, createElement(), createElement())
    const baseTest = new BaseTest(page)

    await expect(baseTest.contains("#root", "world")).resolves.toBe(true)
    await expect(
      baseTest.containsAll("#root", ["Hello", "world"]),
    ).resolves.toBe(true)
    await expect(baseTest.notContains("#root", "missing")).resolves.toBe(true)
    await expect(baseTest.exists(LIST)).resolves.toBe(true)
    await expect(baseTest.notExists("#missing")).resolves.toBe(true)
    await expect(baseTest.count(LIST)).resolves.toBe(2)
  })

  it("performs common element actions", async () => {
    const page = new FakePage()
    const element = createElement()
    page.set(BUTTON, element)
    const baseTest = new BaseTest(page)

    await baseTest.scrollTo(BUTTON)
    await baseTest.waitFor(BUTTON)
    await baseTest.hover(BUTTON)
    await baseTest.press(BUTTON, "Enter")
    await expect(
      baseTest.selectOption(BUTTON, ["one", "two"]),
    ).resolves.toEqual(["one", "two"])

    expect(element.scrolled).toBe(true)
    expect(element.waited).toBe(true)
    expect(element.hovered).toBe(true)
    expect(element.pressedKey).toBe("Enter")
    expect(element.selectedValues).toEqual(["one", "two"])
  })

  it("reads ordered elements and visibility", async () => {
    const page = new FakePage()
    const first = createElement({ text: "first", visible: false })
    const second = createElement({ text: "second" })
    page.set(LIST, first, second)
    const baseTest = new BaseTest(page)

    await expect(baseTest.textAt(LIST, ELEMENT_INDEX)).resolves.toBe("second")
    const firstLocator = page.locator(LIST).nth(FIRST_INDEX)
    const secondLocator = page.locator(LIST).nth(ELEMENT_INDEX)
    await expect(baseTest.isVisible(secondLocator)).resolves.toBe(true)
    await expect(baseTest.isVisible(firstLocator)).resolves.toBe(false)
  })

  it("drags a target onto another target", async () => {
    const page = new FakePage()
    const source = createElement()
    const target = createElement()
    page.set(SOURCE, source)
    page.set(TARGET, target)
    const baseTest = new BaseTest(page)

    await baseTest.dragTo(SOURCE, TARGET)

    expect(source.draggedTo).toBe(target)
  })

  it("drags between page coordinates with the mouse", async () => {
    const page = new FakePage()
    const baseTest = new BaseTest(page)

    await baseTest.dragTo(START_POINT, END_POINT)

    expect(page.mouseActions).toEqual([
      { positionX: START_POINT.x, positionY: START_POINT.y, type: "move" },
      { type: "down" },
      { positionX: END_POINT.x, positionY: END_POINT.y, type: "move" },
      { type: "up" },
    ])
  })
})
