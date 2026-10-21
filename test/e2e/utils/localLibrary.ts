import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import type { Page } from "@playwright/test"

/**
 * The front app pins the library to a published commit. Serve the locally built
 * `dist` in place of that dependency so the e2e suite always exercises the code
 * in this working tree, including changes that are not published yet.
 */
const LIBRARY_DEP_ROUTE =
  "**/node_modules/.cache/vite/client/deps/@bullyrom_che-nuxt-modules.js*"
const DIST_PATH = fileURLToPath(
  new URL("../../../dist/index.js", import.meta.url),
)

const IMPORT_URL_PATTERNS = {
  "@vueuse/components":
    /from "(?<url>[^"]*\/@vueuse\/components\/dist\/index\.js[^"]*)"/v,
  pinia: /from "(?<url>[^"]*\/pinia\/dist\/pinia\.mjs[^"]*)"/v,
  vue: /from "(?<url>[^"]*\/vue\/dist\/vue\.runtime\.esm-bundler\.js[^"]*)"/v,
  "vue-router":
    /from "(?<url>[^"]*\/vue-router\/dist\/vue-router\.mjs[^"]*)"/v,
} as const

type BareImport = keyof typeof IMPORT_URL_PATTERNS

const BARE_IMPORTS = Object.keys(IMPORT_URL_PATTERNS) as BareImport[]

/** Resolves the app's own pre-bundled dependency URLs for each import. */
function resolveImportUrls(originalBundle: string) {
  const urls = {} as Record<BareImport, string>
  for (const specifier of BARE_IMPORTS) {
    const url =
      IMPORT_URL_PATTERNS[specifier].exec(originalBundle)?.groups?.url
    if (url === undefined) {
      throw new Error(`Cannot resolve the app URL for "${specifier}"`)
    }
    urls[specifier] = url
  }
  return urls
}

/** Installs a route that replaces the pinned library bundle with `dist`. */
async function installLocalLibrary(page: Page): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const localBundle = await readFile(DIST_PATH, "utf8")

  await page.route(LIBRARY_DEP_ROUTE, async (route) => {
    const response = await route.fetch()
    const originalBundle = await response.text()
    const urls = resolveImportUrls(originalBundle)
    let body = localBundle
    for (const specifier of BARE_IMPORTS) {
      body = body.replaceAll(
        `from "${specifier}"`,
        `from "${urls[specifier]}"`,
      )
    }
    await route.fulfill({ body, response })
  })
}

export { installLocalLibrary }
