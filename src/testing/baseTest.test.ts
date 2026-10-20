import { describe, expect, it } from "vitest"

import { createElement, setChildren } from "../../test/fakeDom"
import { FakePage } from "../../test/fakePage"

import { BaseTest } from "./baseTest"

const BASE_URL = "https://example.test"
const BASE_PATH = "/app"
const PATH = "/items"
const ROOT = "body"
const BUTTON = "#button"
const LIST = "#list"
const SELECT = ".v-select"
const EMPTY_SELECT = "#empty-select"
const OPTION = "#option"
const FILTERED = ".filtered"
const CARDS = ".cards"
const OPTION_TEXT = "Alpha"
const ORDER = 0
const SECOND_ORDER = 1
const INITIAL_CARD_COUNT = 1
const SCROLL_COUNT = 2
const FILTER_WAIT_COUNT = 2

describe("BaseTest", () => {
  it("navigates through configured URLs and clicks locator targets", async () => {
    const page = new FakePage()
    const button = createElement()
    page.set(BUTTON, button)
    const baseTest = new BaseTest(page, {
      basePath: BASE_PATH,
      baseUrl: BASE_URL,
    })

    await baseTest.goToBaseUrl()
    await baseTest.goToPath(PATH)
    await baseTest.pageClick(page.locator(BUTTON))

    expect(page.visitedUrls).toEqual([
      `${BASE_URL}${BASE_PATH}`,
      `${BASE_URL}${BASE_PATH}${PATH}`,
    ])
    expect(button.clicked).toBe(true)
  })

  it("asserts page text and its absence", async () => {
    const page = new FakePage()
    page.set(ROOT, createElement({ text: "Hello world" }))
    const baseTest = new BaseTest(page)

    await expect(baseTest.expectPageHasText("world")).resolves.toBeUndefined()
    await expect(
      baseTest.expectPageHasTexts(["Hello", "world"]),
    ).resolves.toBeUndefined()
    await expect(
      baseTest.expectPageHasNoText("missing"),
    ).resolves.toBeUndefined()
    await expect(baseTest.expectPageHasText("missing")).rejects.toThrow()
    await expect(baseTest.expectPageHasNoText("world")).rejects.toThrow()
  })

  it("asserts selectors and their absence", async () => {
    const page = new FakePage()
    page.set(LIST, createElement(), createElement())
    const baseTest = new BaseTest(page)

    await expect(baseTest.expectPageHasSelector(LIST)).resolves.toBeUndefined()
    await expect(
      baseTest.expectPageHasNoSelector("#missing"),
    ).resolves.toBeUndefined()
    await expect(baseTest.expectPageHasSelector("#missing")).rejects.toThrow()
    await expect(baseTest.expectPageHasNoSelector(LIST)).rejects.toThrow()
  })

  it("asserts ordered element text with regular expressions", async () => {
    const page = new FakePage()
    page.set(
      LIST,
      createElement({ text: "first" }),
      createElement({ text: "second" }),
    )
    const baseTest = new BaseTest(page)

    await expect(
      baseTest.exceptOrderElementHasText(LIST, SECOND_ORDER, "sec.nd"),
    ).resolves.toBeUndefined()
    await expect(
      baseTest.exceptOrderElementHasText(LIST, SECOND_ORDER, "first"),
    ).rejects.toThrow()
  })

  it("opens a select and asserts uploaded options", async () => {
    const page = new FakePage()
    const select = createElement()
    const emptySelect = createElement()
    setChildren(select, "li", createElement(), createElement())
    page.set(SELECT, select)
    page.set(EMPTY_SELECT, emptySelect)
    const baseTest = new BaseTest(page)

    await expect(
      baseTest.expectVueSelectUploadedOptions(ORDER),
    ).resolves.toBeUndefined()
    await expect(
      baseTest.expectVueSelectUploadedOptions(ORDER, EMPTY_SELECT),
    ).rejects.toThrow()
    expect(select.clicked).toBe(true)
    expect(emptySelect.clicked).toBe(true)
  })

  it("asserts lazy loading by scrolling and recounting cards", async () => {
    const page = new FakePage()
    let cardCount = INITIAL_CARD_COUNT
    page.set(CARDS, createElement())
    page.onScroll(CARDS, () => {
      cardCount += 1
      page.set(
        CARDS,
        ...Array.from({ length: cardCount }, () => createElement()),
      )
    })
    const baseTest = new BaseTest(page)

    await expect(baseTest.isLazyLoadingWorks(CARDS)).resolves.toBeUndefined()

    expect(cardCount).toBe(INITIAL_CARD_COUNT + SCROLL_COUNT)
    expect(page.waitForTimeouts).toHaveLength(SCROLL_COUNT)
  })

  it("drags one locator target onto another", async () => {
    const page = new FakePage()
    const source = createElement()
    const target = createElement()
    page.set("#source", source)
    page.set("#target", target)
    const baseTest = new BaseTest(page)

    await baseTest.dragAndDrop("#source", "#target")

    expect(source.draggedTo).toBe(target)
  })

  it("checks that selecting a filter updates the first block", async () => {
    const page = new FakePage()
    const select = createElement()
    const option = createElement({ text: OPTION_TEXT })
    const filteredBlock = createElement({ text: OPTION_TEXT })
    page.set(SELECT, select)
    page.set(OPTION, option)
    page.set(FILTERED, filteredBlock)
    const baseTest = new BaseTest(page)

    await expect(
      baseTest.exceptVueSelectCanFilterBlockBySelector(
        SELECT,
        OPTION,
        FILTERED,
      ),
    ).resolves.toBeUndefined()
    expect(select.clicked).toBe(true)
    expect(option.clicked).toBe(true)
    expect(page.waitForTimeouts).toHaveLength(FILTER_WAIT_COUNT)

    page.set(FILTERED, createElement({ text: "Beta" }))
    await expect(
      baseTest.exceptVueSelectCanFilterBlockBySelector(
        SELECT,
        OPTION,
        FILTERED,
      ),
    ).rejects.toThrow()
  })
})
