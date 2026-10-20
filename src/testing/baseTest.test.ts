import { describe, expect, it, vi } from "vitest"

import { BaseTest } from "./baseTest"

import type { LocatorLike, PageLike } from "./types"

const DEFAULT_TEXT = "Hello"
const TEST_ID = "submit"
const CUSTOM_ATTRIBUTE = "data-qa"

/** Creates a locator that records every call it receives. */
function createFakeLocator() {
  const locator = {
    click: vi.fn(() => Promise.resolve(undefined)),
    fill: vi.fn(() => Promise.resolve(undefined)),
    isVisible: vi.fn(() => Promise.resolve(true)),
    scrollIntoViewIfNeeded: vi.fn(() => Promise.resolve(undefined)),
    textContent: vi.fn(() => Promise.resolve(DEFAULT_TEXT)),
    waitFor: vi.fn(() => Promise.resolve(undefined)),
  } satisfies LocatorLike

  return locator
}

/** Creates a page-like object backed by a fake locator. */
function createFakePage(locator: LocatorLike = createFakeLocator()) {
  const page = {
    goto: vi.fn(() => Promise.resolve(undefined)),
    locator: vi.fn(() => locator),
  } satisfies PageLike

  return { locator, page }
}

describe("BaseTest", () => {
  it("delegates navigation to the page", async () => {
    const { page } = createFakePage()
    const baseTest = new BaseTest(page)

    await baseTest.goto("https://example.test/path")

    expect(page.goto).toHaveBeenCalledWith("https://example.test/path")
  })

  it("builds test id locators with the default attribute", () => {
    const { page } = createFakePage()
    const baseTest = new BaseTest(page)

    baseTest.byTestId(TEST_ID)

    expect(page.locator).toHaveBeenCalledWith(`[data-testid="${TEST_ID}"]`)
  })

  it("supports a custom test id attribute", () => {
    const { page } = createFakePage()
    const baseTest = new BaseTest(page, { testIdAttribute: CUSTOM_ATTRIBUTE })

    baseTest.byTestId(TEST_ID)

    expect(page.locator).toHaveBeenCalledWith(`[data-qa="${TEST_ID}"]`)
  })

  it("escapes quotes in test ids", () => {
    const { page } = createFakePage()
    const baseTest = new BaseTest(page)

    baseTest.byTestId('a"b')

    expect(page.locator).toHaveBeenCalledWith(String.raw`[data-testid="a\"b"]`)
  })

  it("delegates click and fill by test id", async () => {
    const { locator, page } = createFakePage()
    const baseTest = new BaseTest(page)
    const clickOptions = { force: true }

    await baseTest.clickTestId(TEST_ID, clickOptions)
    await baseTest.fillTestId(TEST_ID, "value")

    expect(locator.click).toHaveBeenCalledWith(clickOptions)
    expect(locator.fill).toHaveBeenCalledWith("value")
  })

  it("reads text and visibility by test id", async () => {
    const { page } = createFakePage()
    const baseTest = new BaseTest(page)

    await expect(baseTest.textTestId(TEST_ID)).resolves.toBe(DEFAULT_TEXT)
    await expect(baseTest.isVisibleTestId(TEST_ID)).resolves.toBe(true)
  })

  it("waits for and scrolls to a test id", async () => {
    const { locator, page } = createFakePage()
    const baseTest = new BaseTest(page)
    const waitOptions = { state: "visible" as const }

    await baseTest.waitForTestId(TEST_ID, waitOptions)
    await baseTest.scrollToTestId(TEST_ID)

    expect(locator.waitFor).toHaveBeenCalledWith(waitOptions)
    expect(locator.scrollIntoViewIfNeeded).toHaveBeenCalledTimes(1)
  })

  it("exposes generic locator helpers", async () => {
    const { locator, page } = createFakePage()
    const baseTest = new BaseTest(page)

    await baseTest.click(".button")
    await baseTest.fill(".input", "value")
    await expect(baseTest.text(".label")).resolves.toBe(DEFAULT_TEXT)

    expect(page.locator).toHaveBeenCalledWith(".button")
    expect(page.locator).toHaveBeenCalledWith(".input")
    expect(page.locator).toHaveBeenCalledWith(".label")
    expect(locator.click).toHaveBeenCalledTimes(1)
    expect(locator.fill).toHaveBeenCalledWith("value")
    expect(locator.textContent).toHaveBeenCalledTimes(1)
  })
})
