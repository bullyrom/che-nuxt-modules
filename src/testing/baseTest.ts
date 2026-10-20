import type {
  ClickOptions,
  DragTarget,
  DragToOptions,
  HoverOptions,
  LocatorLike,
  PageLike,
  Point,
  PressOptions,
  SelectOptionOptions,
  Target,
  WaitForOptions,
} from "./types"

/** Checks whether a drag target is a point. */
function isPoint(target: DragTarget): target is Point {
  return typeof target === "object" && "x" in target && "y" in target
}

/**
 * Framework-agnostic technical base class for page-object tests.
 * It only delegates to a page-like object and holds no business logic.
 */
class BaseTest {
  private readonly page: PageLike

  constructor(page: PageLike) {
    this.page = page
  }

  /** Clicks a target. */
  public async click(target: Target, options?: ClickOptions): Promise<void> {
    await this.asLocator(target).click(options)
  }

  /** Returns whether a target contains the given text. */
  public async contains(target: Target, text: string): Promise<boolean> {
    const content = await this.text(target)
    return content.includes(text)
  }

  /** Returns whether a target contains all the given texts. */
  public async containsAll(target: Target, texts: string[]): Promise<boolean> {
    const content = await this.text(target)
    return texts.every((text) => content.includes(text))
  }

  /** Returns the number of elements matched by a selector. */
  public count(selector: string): Promise<number> {
    return this.locator(selector).count()
  }

  /** Drags one target to another, or drags between page coordinates. */
  public async dragTo(
    from: DragTarget,
    to: DragTarget,
    options?: DragToOptions,
  ): Promise<void> {
    if (isPoint(from) || isPoint(to)) {
      await this.dragPoints(from, to)
      return
    }

    await this.asLocator(from).dragTo(this.asLocator(to), options)
  }

  /** Returns whether at least one element matches a selector. */
  public async exists(selector: string): Promise<boolean> {
    return (await this.count(selector)) > 0
  }

  /** Fills a target with a value. */
  public async fill(target: Target, value: string): Promise<void> {
    await this.asLocator(target).fill(value)
  }

  /** Alias for `locator`. */
  public find(selector: string): LocatorLike {
    return this.locator(selector)
  }

  /** Navigates to the given URL. */
  public async goto(url: string): Promise<void> {
    await this.page.goto(url)
  }

  /** Hovers over a target. */
  public async hover(target: Target, options?: HoverOptions): Promise<void> {
    await this.asLocator(target).hover(options)
  }

  /** Returns whether a target is visible. */
  public isVisible(target: Target): Promise<boolean> {
    return this.asLocator(target).isVisible()
  }

  /** Returns a generic locator for a CSS selector. */
  public locator(selector: string): LocatorLike {
    return this.page.locator(selector)
  }

  /** Returns whether a target does not contain the given text. */
  public async notContains(target: Target, text: string): Promise<boolean> {
    return !(await this.contains(target, text))
  }

  /** Returns whether no element matches a selector. */
  public async notExists(selector: string): Promise<boolean> {
    return !(await this.exists(selector))
  }

  /** Presses a key on a target. */
  public async press(
    target: Target,
    key: string,
    options?: PressOptions,
  ): Promise<void> {
    await this.asLocator(target).press(key, options)
  }

  /** Scrolls a target into view. */
  public async scrollTo(target: Target): Promise<void> {
    await this.asLocator(target).scrollIntoViewIfNeeded()
  }

  /** Selects options in a target. */
  public selectOption(
    target: Target,
    values: string | string[],
    options?: SelectOptionOptions,
  ): Promise<string[]> {
    return this.asLocator(target).selectOption(values, options)
  }

  /** Returns the text content of a target. */
  public async text(target: Target): Promise<string> {
    const content = await this.asLocator(target).textContent()
    return content ?? ""
  }

  /** Returns the text content of the element at the given index. */
  public async textAt(selector: string, index: number): Promise<string> {
    const content = await this.locator(selector).nth(index).textContent()
    return content ?? ""
  }

  /** Waits for a target. */
  public async waitFor(
    target: Target,
    options?: WaitForOptions,
  ): Promise<void> {
    await this.asLocator(target).waitFor(options)
  }

  /** Resolves a selector or locator to a locator. */
  private asLocator(target: Target): LocatorLike {
    return typeof target === "string" ? this.locator(target) : target
  }

  /** Drags between page coordinates using the page mouse. */
  private async dragPoints(from: DragTarget, to: DragTarget): Promise<void> {
    if (!isPoint(from) || !isPoint(to)) {
      throw new Error("Both drag targets must be points or locators")
    }

    const { mouse } = this.page
    if (!mouse) throw new Error("Page mouse is not available")

    await mouse.move(from.x, from.y)
    await mouse.down()
    await mouse.move(to.x, to.y)
    await mouse.up()
  }
}

export { BaseTest }
