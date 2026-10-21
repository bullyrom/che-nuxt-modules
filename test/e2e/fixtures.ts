import { test as base } from "@playwright/test"

import { installLocalLibrary } from "./utils/localLibrary"

/** Playwright test with the locally built library bundle injected. */
const test = base.extend({
  page: async ({ page }, use) => {
    await installLocalLibrary(page)
    await use(page)
  },
})

export { test }

export { expect } from "@playwright/test"
