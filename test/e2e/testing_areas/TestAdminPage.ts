import { expect } from "@playwright/test"

import { BaseTest } from "@bullyrom/che-nuxt-modules/testing"

import {
  ADMIN_INDEX_PATH,
  ADMIN_LIST_PATH,
  ADMIN_RECORD_PATH_PATTERN,
  BACK_ACTION,
  CREATE_ACTION,
  CUSTOM_HEADER_TEST_ID,
  CUSTOM_HEADER_TEXT_PREFIX,
  EXPECT_TIMEOUT_MS,
  INDEX_PLACEHOLDER,
  PLAY_AUDIO_BUTTON_PATTERN,
  SHORT_TIMEOUT_MS,
  VIEW_ACTION,
} from "../constants"
import { waitForAdminHydration } from "../utils/hydration"

import type { Locator, Page } from "@playwright/test"

interface TestAdminPageOptions {
  baseUrl: string
  page: Page
}

/** Detail root rendered by the front's routed record page. */
const DETAIL_ROOT = ".admin-record-detail"
const GRID_CELL_LEVELS_UP = 2

/** Page object for the OpenAPI admin list, record view and routed pages. */
class TestAdminPage {
  public readonly page: Page

  private readonly baseTest: BaseTest

  constructor(options: TestAdminPageOptions) {
    this.page = options.page
    this.baseTest = new BaseTest(options)
  }

  /** Returns from a list to the endpoints index. */
  async backToIndex(): Promise<void> {
    await this.page
      .getByRole("button", { exact: true, name: BACK_ACTION })
      .click()
    await expect(this.page).toHaveURL(
      (url) => url.pathname === ADMIN_INDEX_PATH,
    )
    await expect(
      this.page.getByText(INDEX_PLACEHOLDER, { exact: true }),
    ).toBeVisible()
  }

  /** Asserts that the configured custom header replaced the default one. */
  async expectCustomHeader(entityName: string): Promise<void> {
    await expect(this.page.getByTestId(CUSTOM_HEADER_TEST_ID)).toHaveText(
      `${CUSTOM_HEADER_TEXT_PREFIX}${entityName}`,
    )
    await expect(
      this.page.getByRole("button", { exact: true, name: CREATE_ACTION }),
    ).toHaveCount(0)
  }

  /** Asserts the default list header (back, create, title and base path). */
  async expectDefaultHeader(
    entityName: string,
    basePath: string,
  ): Promise<void> {
    await expect(
      this.page.getByRole("button", { exact: true, name: BACK_ACTION }),
    ).toBeVisible()
    await expect(
      this.page.getByRole("button", { exact: true, name: CREATE_ACTION }),
    ).toBeVisible()
    await expect(this.page.getByText(basePath, { exact: true })).toBeVisible()
    await this.expectListReady(entityName)
  }

  /** Asserts that the routed record view is open for the entity. */
  async expectDetail(entityName: string): Promise<void> {
    await expect(this.page.locator(DETAIL_ROOT)).toBeVisible({
      timeout: EXPECT_TIMEOUT_MS,
    })
    await expect(
      this.page
        .getByRole("heading", { level: 2 })
        .filter({ hasText: entityName }),
    ).toBeVisible()
  }

  /** Asserts that the detail shows an audio control but no player yet. */
  async expectDetailAudioCollapsed(): Promise<void> {
    const detail = this.page.locator(DETAIL_ROOT)
    await expect(
      detail.getByRole("button", { name: PLAY_AUDIO_BUTTON_PATTERN }).first(),
    ).toBeVisible()
    await expect(detail.locator("audio")).toHaveCount(0)
  }

  /** Asserts that the detail renders a download link with the given href. */
  async expectDetailDownload(hrefPattern: RegExp): Promise<void> {
    await expectDownload(
      this.page.locator(DETAIL_ROOT).locator("a[download]"),
      hrefPattern,
    )
  }

  /** Asserts that the configured grid renders the expected column count. */
  async expectGridColumns(count: number): Promise<void> {
    await expect.poll(() => this.gridColumnCount()).toBe(count)
  }

  /** Asserts that the list shows an audio control but no player yet. */
  async expectListAudioCollapsed(): Promise<void> {
    await expect(
      this.page
        .getByRole("button", { name: PLAY_AUDIO_BUTTON_PATTERN })
        .first(),
    ).toBeVisible()
    await expect(this.page.locator("audio")).toHaveCount(0)
  }

  /** Asserts that the list renders a download link with the given href. */
  async expectListDownload(hrefPattern: RegExp): Promise<void> {
    await expectDownload(this.page.locator("a[download]"), hrefPattern)
  }

  /** Waits until the list header and its records area are rendered. */
  async expectListReady(entityName: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        exact: true,
        level: 2,
        name: entityName,
      }),
    ).toBeVisible({ timeout: EXPECT_TIMEOUT_MS })
  }

  /** Asserts that the current route is the entity list. */
  async expectListUrl(
    entityName: string,
    timeout = EXPECT_TIMEOUT_MS,
  ): Promise<void> {
    await expect(this.page).toHaveURL(
      (url) => url.pathname === `${ADMIN_LIST_PATH}/${entityName}`,
      { timeout },
    )
  }

  /** Asserts that the sidebar contains a namespace group. */
  async expectSidebarGroup(namespace: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { exact: true, name: namespace }),
    ).toBeVisible()
  }

  /** Returns the href of the first `View` link in the list. */
  async firstViewHref(): Promise<string> {
    const link = this.page.getByRole("link", { name: VIEW_ACTION }).first()
    await expect(link).toBeVisible()
    const href = await link.getAttribute("href")
    if (href === undefined || href === null) {
      throw new Error("The list View action has no href")
    }
    return href
  }

  /** Returns the number of columns in the list grid. */
  gridColumnCount(): Promise<number> {
    const link = this.page.getByRole("link", { name: VIEW_ACTION }).first()
    const card = link.locator(
      'xpath=ancestor::div[contains(@class,"rounded-xl")][1]',
    )
    let cell = card
    for (let level = 0; level < GRID_CELL_LEVELS_UP; level += 1) {
      cell = cell.locator("..")
    }
    return cell.evaluate((element) => {
      const columns = getComputedStyle(element).gridTemplateColumns
      return columns.split(" ").filter((column) => column !== "").length
    })
  }

  /** Opens the endpoints index with its entity sidebar. */
  async openEndpointsIndex(): Promise<void> {
    await this.baseTest.goToPath(ADMIN_INDEX_PATH)
    await waitForAdminHydration(this.page)
    await expect(
      this.page.getByText(INDEX_PLACEHOLDER, { exact: true }),
    ).toBeVisible({ timeout: EXPECT_TIMEOUT_MS })
    await expect(
      this.page.getByRole("heading", { exact: true, name: "Endpoints" }),
    ).toBeVisible()
  }

  /** Opens the first record through its `View` link. */
  async openFirstRecord(): Promise<void> {
    await waitForAdminHydration(this.page)
    await this.page.getByRole("link", { name: VIEW_ACTION }).first().click()
    await expect(this.page).toHaveURL(ADMIN_RECORD_PATH_PATTERN)
  }

  /** Opens an entity list directly through its URL. */
  async openList(entityName: string): Promise<void> {
    await this.baseTest.goToPath(`${ADMIN_LIST_PATH}/${entityName}`)
    await waitForAdminHydration(this.page)
    await this.expectListReady(entityName)
  }

  /** Opens an absolute admin path. */
  async openPath(path: string): Promise<void> {
    await this.baseTest.goToPath(path)
    await waitForAdminHydration(this.page)
  }

  /** Clicks the detail play button and asserts the created player source. */
  async playDetailAudio(sourcePattern: RegExp): Promise<void> {
    const detail = this.page.locator(DETAIL_ROOT)
    await detail
      .getByRole("button", { name: PLAY_AUDIO_BUTTON_PATTERN })
      .first()
      .click()
    await expectMedia(detail.locator("audio"), sourcePattern)
  }

  /** Clicks the list play button and asserts the created player source. */
  async playListAudio(sourcePattern: RegExp): Promise<void> {
    await this.page
      .getByRole("button", { name: PLAY_AUDIO_BUTTON_PATTERN })
      .first()
      .click()
    await expectMedia(this.page.locator("audio"), sourcePattern)
  }

  /**
   * Selects an entity in the sidebar and waits for its list route. The first
   * click can be lost before hydration finishes, so it is retried once.
   */
  async selectEntity(
    entityName: string,
    options: { customHeader?: boolean } = {},
  ): Promise<void> {
    await waitForAdminHydration(this.page)
    const button = this.page.getByRole("button", {
      exact: true,
      name: entityName,
    })
    await expect(button).toBeVisible()
    await button.click()
    try {
      await this.expectListUrl(entityName, SHORT_TIMEOUT_MS)
    } catch {
      await button.click()
      await this.expectListUrl(entityName)
    }
    if (options.customHeader !== true) await this.expectListReady(entityName)
  }
}

/** Asserts that the first link is a download whose href matches the pattern. */
async function expectDownload(
  links: Locator,
  hrefPattern: RegExp,
): Promise<void> {
  await expect(links.first()).toBeVisible()
  await expect(links.first()).toHaveAttribute("href", hrefPattern)
}

/** Asserts that the first media element matches the source pattern. */
async function expectMedia(
  media: Locator,
  sourcePattern: RegExp,
): Promise<void> {
  await expect(media.first()).toBeVisible()
  await expect(media.first()).toHaveAttribute("src", sourcePattern)
}

export { TestAdminPage }
