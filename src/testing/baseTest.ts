import type {
  BaseTestOptions,
  ClickOptions,
  DragToOptions,
  LocatorLike,
  PageLike,
} from "./types"

/** Default root used for page-wide text checks instead of Nuxt 2 `#__nuxt`. */
const DEFAULT_PAGE_ROOT_SELECTOR = "body"

/** Default select selector used by the Vue-select helpers. */
const DEFAULT_SELECT_SELECTOR = ".v-select"

/** Default delay between lazy-loading checks. */
const DEFAULT_LAZY_LOAD_DELAY_MS = 2000

/** Default delay after filter interactions. */
const DEFAULT_FILTER_DELAY_MS = 1000

/** Throws when a page assertion fails. */
function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

/** Checks text against the regular expression built from the given value. */
function matchesText(content: string, text: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-regexp
  return new RegExp(text, "v").test(content)
}

/** Reads locator text, normalizing a missing value to an empty string. */
async function readText(locator: LocatorLike): Promise<string> {
  const content = await locator.textContent()
  return content ?? ""
}

/**
 * Framework-agnostic technical base class for page-object tests.
 * It ports the technical methods of the former Playwright BaseTest and only
 * works through page-like/locator-like objects.
 */
class BaseTest {
  private readonly basePath?: string
  private readonly baseUrl?: string
  private readonly filterDelayMs: number
  private readonly lazyLoadDelayMs: number
  private readonly page: PageLike
  private readonly pageRootSelector: string
  private readonly selectSelector: string

  constructor(page: PageLike, options: BaseTestOptions = {}) {
    this.page = page
    this.baseUrl = options.baseUrl
    this.basePath = options.basePath
    this.pageRootSelector =
      options.pageRootSelector ?? DEFAULT_PAGE_ROOT_SELECTOR
    this.selectSelector = options.selectSelector ?? DEFAULT_SELECT_SELECTOR
    this.lazyLoadDelayMs =
      options.lazyLoadDelayMs ?? DEFAULT_LAZY_LOAD_DELAY_MS
    this.filterDelayMs = options.filterDelayMs ?? DEFAULT_FILTER_DELAY_MS
  }

  /** Drags one target to another. Coordinates are replaced by locators. */
  public async dragAndDrop(
    from: LocatorLike | string,
    to: LocatorLike | string,
    options?: DragToOptions,
  ): Promise<void> {
    await this.asLocator(from).dragTo(this.asLocator(to), options)
  }

  /** Asserts that the element at the given index matches the text. */
  public async exceptOrderElementHasText(
    selector: string,
    order: number,
    text: string,
  ): Promise<void> {
    const content = await readText(this.asLocator(selector).nth(order))
    assert(
      matchesText(content, text),
      `Expected element ${order} of ${selector} to match text: ${text}`,
    )
  }

  /** Asserts that filtering the select updates the first filtered block. */
  public async exceptVueSelectCanFilterBlockBySelector(
    selectTarget: LocatorLike | string,
    optionTarget: LocatorLike | string,
    filterableBlockSelector: string,
  ): Promise<void> {
    await this.pageClick(selectTarget)
    await this.waitForTimeout(this.filterDelayMs)

    const optionText = await readText(this.asLocator(optionTarget))
    await this.pageClick(optionTarget)
    await this.waitForTimeout(this.filterDelayMs)

    const firstBlock = await readText(
      this.asLocator(filterableBlockSelector).first(),
    )
    assert(
      matchesText(firstBlock, optionText),
      `Expected the first filtered block to match text: ${optionText}`,
    )
  }

  /** Asserts that a selector matches no elements. */
  public async expectPageHasNoSelector(selector: string): Promise<void> {
    const elementsCountBySelector = await this.asLocator(selector).count()
    assert(
      elementsCountBySelector === 0,
      `Expected selector to match no elements: ${selector}`,
    )
  }

  /** Asserts that the page root text does not match the given expression. */
  public async expectPageHasNoText(
    text: string,
    selector: string = this.pageRootSelector,
  ): Promise<void> {
    const content = await readText(this.asLocator(selector))
    assert(
      !matchesText(content, text),
      `Expected ${selector} not to match text: ${text}`,
    )
  }

  /** Asserts that a selector matches at least one element. */
  public async expectPageHasSelector(selector: string): Promise<void> {
    const elementsCountBySelector = await this.asLocator(selector).count()
    assert(
      elementsCountBySelector > 0,
      `Expected selector to match elements: ${selector}`,
    )
  }

  /** Asserts that the page root text matches the given regular expression. */
  public async expectPageHasText(
    text: string,
    selector: string = this.pageRootSelector,
  ): Promise<void> {
    const content = await readText(this.asLocator(selector))
    assert(
      matchesText(content, text),
      `Expected ${selector} to match text: ${text}`,
    )
  }

  /** Asserts that the page root text matches every given expression. */
  public async expectPageHasTexts(
    texts: string[],
    selector: string = this.pageRootSelector,
  ): Promise<void> {
    await Promise.all(
      texts.map((text) => this.expectPageHasText(text, selector)),
    )
  }

  /** Opens a Vue-select and asserts that it has uploaded options. */
  public async expectVueSelectUploadedOptions(
    order: number,
    selector: string = this.selectSelector,
  ): Promise<void> {
    const vueSelectElement = this.asLocator(selector).nth(order)
    await vueSelectElement.click()
    const optionsCount = await vueSelectElement.locator("li").count()
    assert(optionsCount > 0, `Expected ${selector} ${order} to have options`)
  }

  /** Navigates to the configured base URL. No dotenv is used. */
  public async goToBaseUrl(): Promise<void> {
    const url = this.getUrl()
    if (url) await this.page.goto(url)
  }

  /** Navigates to the configured base URL plus the given path. */
  public async goToPath(path: string): Promise<void> {
    const url = this.getUrl()
    if (url) await this.page.goto(`${url}${path}`)
  }

  /** Asserts that lazy loading appends cards after scrolling. */
  public async isLazyLoadingWorks(cardClass: string): Promise<void> {
    const firstCardCount = await this.getLazyLoadCardCount(cardClass)
    await this.scrollToLastLazyLoadCard(cardClass)
    await this.waitForTimeout(this.lazyLoadDelayMs)
    const secondCardCount = await this.getLazyLoadCardCount(cardClass)
    await this.scrollToLastLazyLoadCard(cardClass)
    await this.waitForTimeout(this.lazyLoadDelayMs)
    const thirdCardCount = await this.getLazyLoadCardCount(cardClass)

    assert(
      firstCardCount > 0 &&
        firstCardCount < secondCardCount &&
        secondCardCount < thirdCardCount,
      `Expected ${cardClass} count to grow on each scroll`,
    )
  }

  /** Clicks a target. Coordinates are replaced by a locator target. */
  public async pageClick(
    target: LocatorLike | string,
    options?: ClickOptions,
  ): Promise<void> {
    await this.asLocator(target).click(options)
  }

  /** Resolves a selector or locator to a locator. */
  private asLocator(target: LocatorLike | string): LocatorLike {
    return typeof target === "string" ? this.page.locator(target) : target
  }

  /** Returns the current lazy-load card count. */
  private getLazyLoadCardCount(cardClass: string): Promise<number> {
    return this.asLocator(cardClass).count()
  }

  /** Builds the base URL without dotenv. */
  private getUrl(): string | undefined {
    if (!this.baseUrl) return undefined
    return `${this.baseUrl}${this.basePath ?? ""}`
  }

  /** Scrolls the last lazy-load card into view. */
  private async scrollToLastLazyLoadCard(cardClass: string): Promise<void> {
    await this.asLocator(cardClass).last().scrollIntoViewIfNeeded()
  }

  /** Waits through the page adapter or a local timer as a fallback. */
  private waitForTimeout(milliseconds: number): Promise<void> {
    if (this.page.waitForTimeout) {
      return this.page.waitForTimeout(milliseconds)
    }

    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds)
    })
  }
}

export { BaseTest }
