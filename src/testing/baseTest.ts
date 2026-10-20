import { expect } from "@playwright/test"

import type { BaseTestOptions } from "./types"
import type { Locator, Page } from "@playwright/test"

/** Default root used for page-wide text checks, matching the old BaseTest. */
const DEFAULT_PAGE_ROOT_SELECTOR = "#__nuxt"

/** Default selector used by the Vue-select helpers. */
const DEFAULT_SELECT_SELECTOR = ".v-select"

/** A selector or an existing Playwright locator. */
type Target = Locator | string

/**
 * Technical base class for Playwright page-object tests.
 * It ports the former BaseTest methods without dotenv, Nuxt 2 or coordinates.
 */
class BaseTest {
  public page: Page
  protected basePath?: string
  protected baseUrl?: string

  private readonly pageRootSelector: string
  private readonly selectSelector: string

  constructor(options: BaseTestOptions) {
    this.page = options.page
    this.baseUrl = options.baseUrl
    this.basePath = options.basePath
    this.pageRootSelector =
      options.pageRootSelector ?? DEFAULT_PAGE_ROOT_SELECTOR
    this.selectSelector = options.selectSelector ?? DEFAULT_SELECT_SELECTOR
  }

  /** Drags one target to another. The former coordinate variant is replaced. */
  public async dragAndDrop(from: Target, to: Target): Promise<void> {
    await this.asLocator(from).dragTo(this.asLocator(to))
  }

  /** Asserts that the element at the given index matches the text. */
  public async exceptOrderElementHasText(
    selector: string,
    order: number,
    text: string,
  ): Promise<void> {
    const firstElement = this.page.locator(selector).nth(order)
    await expect(firstElement).toHaveText(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(text, "v"),
    )
  }

  /** Asserts that filtering the select updates the first filtered block. */
  public async exceptVueSelectCanFilterBlockBySelector(
    selectTarget: Target,
    optionTarget: Target,
    filterableBlockSelector: string,
  ): Promise<void> {
    await this.pageClick(selectTarget)

    const optionText = await this.asLocator(optionTarget).textContent()
    const filterFirstOptionText = optionText ?? ""

    await this.pageClick(optionTarget)

    const firstCard = this.page.locator(filterableBlockSelector).first()
    await expect(firstCard).toHaveText(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(filterFirstOptionText, "v"),
    )
  }

  /** Asserts that a selector matches no elements. */
  public async expectPageHasNoSelector(selector: string): Promise<void> {
    const elementsCountBySelector = await this.page.locator(selector).count()
    expect(elementsCountBySelector > 0).not.toBeTruthy()
  }

  /** Asserts that the page root text does not match the given expression. */
  public async expectPageHasNoText(text: string): Promise<void> {
    await expect(this.page.locator(this.pageRootSelector)).not.toHaveText(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(text, "v"),
    )
  }

  /** Asserts that a selector matches at least one element. */
  public async expectPageHasSelector(selector: string): Promise<void> {
    const elementsCountBySelector = await this.page.locator(selector).count()
    expect(elementsCountBySelector > 0).toBeTruthy()
  }

  /** Asserts that the page root text matches the given regular expression. */
  public async expectPageHasText(text: string): Promise<void> {
    await expect(this.page.locator(this.pageRootSelector)).toHaveText(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(text, "v"),
    )
  }

  /** Asserts that the page root text matches every given expression. */
  public async expectPageHasTexts(texts: string[]): Promise<void> {
    const results = texts.map((text) => this.expectPageHasText(text))
    await Promise.all(results)
  }

  /** Opens a Vue-select and asserts that it has uploaded options. */
  public async expectVueSelectUploadedOptions(order: number): Promise<void> {
    const vueSelectElement = this.page.locator(this.selectSelector).nth(order)
    await vueSelectElement.click()
    const optionsCount = await vueSelectElement.locator("li").count()
    expect(optionsCount > 0).toBeTruthy()
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
    expect(firstCardCount > 0).toBeTruthy()

    await this.scrollToLastLazyLoadCard(cardClass)
    const secondCardCount = await this.waitForCountGrowth(
      cardClass,
      firstCardCount,
    )

    await this.scrollToLastLazyLoadCard(cardClass)
    await this.waitForCountGrowth(cardClass, secondCardCount)
  }

  /** Clicks a target. The former coordinate variant now takes a locator. */
  public async pageClick(target: Target): Promise<void> {
    await this.asLocator(target).click()
  }

  /** Resolves a selector or locator to a Playwright locator. */
  private asLocator(target: Target): Locator {
    return typeof target === "string" ? this.page.locator(target) : target
  }

  /** Returns the current lazy-load card count. */
  private getLazyLoadCardCount(cardClass: string): Promise<number> {
    return this.page.locator(cardClass).count()
  }

  /** Builds the base URL without dotenv. */
  private getUrl(): string | undefined {
    if (!this.baseUrl) return undefined
    return `${this.baseUrl}${this.basePath ?? ""}`
  }

  /** Scrolls the last lazy-load card into view using Playwright auto-wait. */
  private async scrollToLastLazyLoadCard(cardClass: string): Promise<void> {
    await this.page.locator(cardClass).last().scrollIntoViewIfNeeded()
  }

  /** Waits for the card count to grow with Playwright auto-wait. */
  private async waitForCountGrowth(
    cardClass: string,
    previousCount: number,
  ): Promise<number> {
    await expect
      .poll(() => this.getLazyLoadCardCount(cardClass))
      .toBeGreaterThan(previousCount)
    return this.getLazyLoadCardCount(cardClass)
  }
}

export { BaseTest }
