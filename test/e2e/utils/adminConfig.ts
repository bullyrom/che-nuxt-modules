import type { Page } from "@playwright/test"

/**
 * The deployed admin owns its config and OpenAPI schema. These helpers inject
 * small test-only fragments into the Vite modules so the e2e suite can exercise
 * library features the consumer app does not configure (custom header/grid and
 * date/multi-select fields). The production sources are never modified.
 */
const CONFIG_ROUTE = "**/composables/admin/useAdminPanelConfig.ts*"
const SCHEMA_ROUTE = "**/data/api_schema_87anch.json*"

const LIBRARY_IMPORT_PATTERN =
  /import \{[^\}]*\} from "(?<url>[^"]*bullyrom[^"]*)"/v
const VUE_IMPORT_PATTERN =
  /from "(?<url>[^"]*vue\.runtime\.esm-bundler\.js[^"]*)"/v
const IMAGE_IMPORT = "import { ImageField }"
const IMAGE_AND_MULTISELECT_IMPORT = "import { ImageField, MultiSelect }"
const CONFIG_DECLARATION = "const adminPanelConfig = {"
const TRACK_OVERRIDE_PATTERN = /Track: \{\s*file:/v
const TRACK_SCHEMA_PATTERN = '"Track":{"type":"object","properties":{'

const TEST_HEADER_DECLARATION = `const TestHeader = {
  props: { entity: { type: Object, default: undefined } },
  setup(props) {
    return () =>
      h(
        "header",
        { "data-testid": "custom-header" },
        "header:" + (props.entity?.entityName ?? "none"),
      )
  },
}`

const TEST_TAGS_FIELD_DECLARATION = `const TagsField = {
  props: { modelValue: { type: Array, default: () => [] } },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const options = [
      { label: "one", value: "one" },
      { label: "two", value: "two" },
      { label: "three", value: "three" },
    ]
    return () =>
      h(MultiSelect, {
        modelValue: props.modelValue,
        options,
        placeholder: "Select tags",
        "onUpdate:modelValue": (value) => emit("update:modelValue", value),
      })
  },
}`

const TRACK_SCHEMA_EXTENSION = `${TRACK_SCHEMA_PATTERN}"release_date":{"type":"string","format":"date"},"release_at":{"type":"string","format":"date-time"},"tags":{"type":"array","items":{"type":"string"}},`

interface AdminConfigOverrides {
  customHeader?: boolean
  gridColumns?: number
  multiselectTags?: boolean
}

/** Extends the Track schema with date, date-time and array fields. */
async function installTrackSchemaExtras(page: Page): Promise<void> {
  await page.route(SCHEMA_ROUTE, async (route) => {
    const response = await route.fetch()
    const body = await response.text()
    const extendedBody = body.includes("export const components")
      ? body.replace(TRACK_SCHEMA_PATTERN, TRACK_SCHEMA_EXTENSION)
      : body
    await route.fulfill({ body: extendedBody, response })
  })
}

/** Adds config fragments (custom header, grid, multi-select) to the admin. */
async function installAdminConfigOverrides(
  page: Page,
  overrides: AdminConfigOverrides,
): Promise<void> {
  await page.route(CONFIG_ROUTE, async (route) => {
    const response = await route.fetch()
    const originalBody = await response.text()
    const libraryUrl = LIBRARY_IMPORT_PATTERN.exec(originalBody)?.groups?.url
    if (libraryUrl === undefined) {
      await route.fulfill({ body: originalBody, response })
      return
    }

    let body = originalBody
    const declarations: string[] = []
    const configEntries: string[] = []
    const needsVue =
      overrides.customHeader === true || overrides.multiselectTags === true

    if (needsVue) {
      const vueUrl = await readVueImportUrl(page, response.url(), libraryUrl)
      declarations.push(`import { h } from "${vueUrl}"`)
    }

    if (overrides.customHeader === true) {
      declarations.push(TEST_HEADER_DECLARATION)
      configEntries.push("views: { header: TestHeader }")
    }

    if (overrides.multiselectTags === true) {
      body = body.replace(IMAGE_IMPORT, IMAGE_AND_MULTISELECT_IMPORT)
      declarations.push(TEST_TAGS_FIELD_DECLARATION)
      body = body.replace(
        TRACK_OVERRIDE_PATTERN,
        'Track: { tags: { component: TagsField, kind: "array" }, file:',
      )
    }

    if (overrides.gridColumns !== undefined) {
      configEntries.push(`gridColumns: ${overrides.gridColumns}`)
    }

    if (declarations.length === 0 && configEntries.length === 0) {
      await route.fulfill({ body, response })
      return
    }

    const prefix =
      declarations.length > 0 ? `${declarations.join("\n")}\n` : ""
    const entries =
      configEntries.length > 0 ? ` ${configEntries.join(", ")},` : ""
    body = body.replace(
      CONFIG_DECLARATION,
      `${prefix}${CONFIG_DECLARATION}${entries}`,
    )
    await route.fulfill({ body, response })
  })
}

/** Resolves the app's own Vue module URL so injected components share it. */
async function readVueImportUrl(
  page: Page,
  responseUrl: string,
  libraryUrl: string,
): Promise<string> {
  const absoluteLibraryUrl = new URL(libraryUrl, responseUrl).toString()
  const libraryResponse = await page.request.get(absoluteLibraryUrl)
  const libraryBody = await libraryResponse.text()
  const vueUrl = VUE_IMPORT_PATTERN.exec(libraryBody)?.groups?.url
  if (vueUrl === undefined) {
    throw new Error("Cannot resolve the Vue runtime URL from the admin bundle")
  }
  return vueUrl
}

export { installAdminConfigOverrides, installTrackSchemaExtras }
export type { AdminConfigOverrides }
