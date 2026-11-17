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
const CHAPTER_OVERRIDE_PATTERN = /Chapter: \{\s*attachment:/v
const COMPONENTS_EXPORT_MARKER = "export const components"
const CHAPTER_SCHEMA_MARKER = '"Chapter":{"type":"object"'
const ESCAPED_CHAPTER_SCHEMA_MARKER = String.raw`\"Chapter\":{\"type\":\"object\"`
const SCHEMA_PROPERTIES_MARKER = '"properties":{'
const ESCAPED_SCHEMA_PROPERTIES_MARKER = String.raw`\"properties\":{`
const NOT_FOUND_INDEX = -1

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

const CHAPTER_SCHEMA_FIELDS =
  '"release_date":{"type":"string","format":"date"},"release_at":{"type":"string","format":"date-time"},"tags":{"type":"array","items":{"type":"string"}},'
const ESCAPED_CHAPTER_SCHEMA_FIELDS = CHAPTER_SCHEMA_FIELDS.replaceAll(
  '"',
  String.raw`\"`,
)

interface AdminConfigOverrides {
  customHeader?: boolean
  gridColumns?: number
  hideInternalMenu?: boolean
  multiselectTags?: boolean
}

/** Inserts extra editable properties into the Chapter schema object. */
function extendChapterSchema(body: string): string {
  const componentsIndex = body.indexOf(COMPONENTS_EXPORT_MARKER)
  if (componentsIndex === NOT_FOUND_INDEX) return body

  const escapedChapterIndex = body.indexOf(
    ESCAPED_CHAPTER_SCHEMA_MARKER,
    componentsIndex,
  )
  if (escapedChapterIndex !== NOT_FOUND_INDEX) {
    const escapedPropertiesIndex = body.indexOf(
      ESCAPED_SCHEMA_PROPERTIES_MARKER,
      escapedChapterIndex,
    )
    if (escapedPropertiesIndex !== NOT_FOUND_INDEX) {
      const insertAt =
        escapedPropertiesIndex + ESCAPED_SCHEMA_PROPERTIES_MARKER.length
      return `${body.slice(0, insertAt)}${ESCAPED_CHAPTER_SCHEMA_FIELDS}${body.slice(insertAt)}`
    }
  }

  const chapterIndex = body.indexOf(CHAPTER_SCHEMA_MARKER, componentsIndex)
  if (chapterIndex === NOT_FOUND_INDEX) return body
  const propertiesIndex = body.indexOf(SCHEMA_PROPERTIES_MARKER, chapterIndex)
  if (propertiesIndex === NOT_FOUND_INDEX) return body
  const insertAt = propertiesIndex + SCHEMA_PROPERTIES_MARKER.length
  return `${body.slice(0, insertAt)}${CHAPTER_SCHEMA_FIELDS}${body.slice(insertAt)}`
}

/** Extends the Chapter schema with date, date-time and array fields. */
async function installChapterSchemaExtras(page: Page): Promise<void> {
  await page.route(SCHEMA_ROUTE, async (route) => {
    const response = await route.fetch()
    const body = await response.text()
    await route.fulfill({ body: extendChapterSchema(body), response })
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
        CHAPTER_OVERRIDE_PATTERN,
        'Chapter: { tags: { component: TagsField, kind: "array" }, attachment:',
      )
    }

    if (overrides.gridColumns !== undefined) {
      configEntries.push(`gridColumns: ${overrides.gridColumns}`)
    }

    if (overrides.hideInternalMenu === true) {
      configEntries.push("menu: { showInAdmin: false }")
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

export { installAdminConfigOverrides, installChapterSchemaExtras }
export type { AdminConfigOverrides }
