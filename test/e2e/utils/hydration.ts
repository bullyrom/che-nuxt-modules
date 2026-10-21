import type { Page } from "@playwright/test"

interface VueRoot extends Element {
  __vue_app__?: {
    config?: { globalProperties?: Record<string, unknown> }
  }
}

/**
 * Waits until Nuxt has hydrated the page and Pinia stores exist. SSR markup is
 * visible before hydration, but clicks made before it are lost.
 */
async function waitForAdminHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const root = document.querySelector("#__nuxt") as null | VueRoot
    // eslint-disable-next-line no-underscore-dangle
    const app = root?.__vue_app__
    const pinia = app?.config?.globalProperties?.$pinia as
      | undefined
      | { _s?: Map<string, unknown> }
    // eslint-disable-next-line no-underscore-dangle
    return (pinia?._s?.size ?? 0) > 0
  })
}

export { waitForAdminHydration }
