import type { Page } from "@playwright/test"

/** BaseTest configuration. */
interface BaseTestOptions {
  basePath?: string
  baseUrl?: string
  page: Page
  pageRootSelector?: string
  selectSelector?: string
}

export type { BaseTestOptions }
