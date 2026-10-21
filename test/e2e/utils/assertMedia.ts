import { expect } from "@playwright/test"

import { EXPECT_TIMEOUT_MS } from "../constants"

import type { Locator } from "@playwright/test"

/** Asserts that the first link is a download whose href matches the pattern. */
async function expectDownload(
  links: Locator,
  hrefPattern: RegExp,
  timeout = EXPECT_TIMEOUT_MS,
): Promise<void> {
  await expect(links.first()).toBeVisible({ timeout })
  await expect(links.first()).toHaveAttribute("href", hrefPattern, {
    timeout,
  })
}

/** Asserts that the first media element matches the source pattern. */
async function expectMedia(
  media: Locator,
  sourcePattern: RegExp,
  timeout = EXPECT_TIMEOUT_MS,
): Promise<void> {
  await expect(media.first()).toBeVisible({ timeout })
  await expect(media.first()).toHaveAttribute("src", sourcePattern, {
    timeout,
  })
}

export { expectDownload, expectMedia }
