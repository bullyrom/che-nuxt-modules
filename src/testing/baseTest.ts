import type {
  BaseTestOptions,
  ClickOptions,
  LocatorLike,
  PageLike,
  WaitForOptions,
} from "./types"

/** Default attribute used to find elements by test id. */
const DEFAULT_TEST_ID_ATTRIBUTE = "data-testid"

/** Escapes a value for use inside a quoted CSS attribute selector. */
function escapeAttributeValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', String.raw`\"`)
}

/**
 * Framework-agnostic technical base class for page-object tests.
 * It only delegates to a page-like object and holds no business logic.
 */
class BaseTest {
  private readonly page: PageLike
  private readonly testIdAttribute: string

  constructor(page: PageLike, options: BaseTestOptions = {}) {
    this.page = page
    this.testIdAttribute = options.testIdAttribute ?? DEFAULT_TEST_ID_ATTRIBUTE
  }

  /** Returns a locator for an element with the given test id. */
  public byTestId(testId: string): LocatorLike {
    const attributeValue = escapeAttributeValue(testId)
    return this.page.locator(`[${this.testIdAttribute}="${attributeValue}"]`)
  }

  /** Clicks an element found by a CSS selector. */
  public async click(selector: string, options?: ClickOptions): Promise<void> {
    await this.locator(selector).click(options)
  }

  /** Clicks an element by test id. */
  public async clickTestId(
    testId: string,
    options?: ClickOptions,
  ): Promise<void> {
    await this.byTestId(testId).click(options)
  }

  /** Fills an element found by a CSS selector. */
  public async fill(selector: string, value: string): Promise<void> {
    await this.locator(selector).fill(value)
  }

  /** Fills an element by test id. */
  public async fillTestId(testId: string, value: string): Promise<void> {
    await this.byTestId(testId).fill(value)
  }

  /** Navigates to the given URL. */
  public async goto(url: string): Promise<void> {
    await this.page.goto(url)
  }

  /** Returns whether an element by test id is visible. */
  public isVisibleTestId(testId: string): Promise<boolean> {
    return this.byTestId(testId).isVisible()
  }

  /** Returns a generic locator for a CSS selector. */
  public locator(selector: string): LocatorLike {
    return this.page.locator(selector)
  }

  /** Scrolls an element by test id into view. */
  public async scrollToTestId(testId: string): Promise<void> {
    await this.byTestId(testId).scrollIntoViewIfNeeded()
  }

  /** Returns the text content of an element found by a CSS selector. */
  public text(selector: string): Promise<null | string> {
    return this.locator(selector).textContent()
  }

  /** Returns the text content of an element by test id. */
  public textTestId(testId: string): Promise<null | string> {
    return this.byTestId(testId).textContent()
  }

  /** Waits for an element by test id. */
  public async waitForTestId(
    testId: string,
    options?: WaitForOptions,
  ): Promise<void> {
    await this.byTestId(testId).waitFor(options)
  }
}

export { BaseTest }
