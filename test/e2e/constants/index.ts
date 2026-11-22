import {
  escapeRegExp,
  loadTestEnvironment,
  readEnvironment,
  readEnvironmentList,
} from "../utils/environment"

loadTestEnvironment()

const DEFAULT_FRONTEND_URL = "http://localhost:3000"
const FRONTEND_URL = readEnvironment(
  "PW_TEST_FRONTEND_URL",
  DEFAULT_FRONTEND_URL,
).replace(/\/$/v, "")

const ADMIN_INDEX_PATH = "/admin/endpoints/"
const ADMIN_LIST_PATH = "/admin/endpoints"
const ADMIN_RECORD_PATH_PATTERN = /\/admin\/endpoints\/[^\/]+\/\d+$/v

const CHAPTERS_ENTITY = readEnvironment("PW_TEST_MAIN_ENTITY", "chapters")
const MEASUREMENTS_ENTITY = readEnvironment(
  "PW_TEST_MEASUREMENTS_ENTITY",
  "measurements",
)
const BOOKS_ENTITY = readEnvironment("PW_TEST_SECOND_ENTITY", "books")
const GRID_ENTITY = readEnvironment("PW_TEST_GRID_ENTITY", "categories")
const CHAPTERS_BASE_PATH = readEnvironment(
  "PW_TEST_MAIN_ENTITY_BASE_PATH",
  "/api/v1/catalog/chapters/",
)
const BOOKS_BASE_PATH = readEnvironment(
  "PW_TEST_SECOND_ENTITY_BASE_PATH",
  "/api/v1/catalog/books/",
)
const ATTACHMENT_FIELD = readEnvironment(
  "PW_TEST_MAIN_ENTITY_ATTACHMENT_FIELD",
  "attachment",
)
const DOWNLOAD_SEGMENT = readEnvironment(
  "PW_TEST_SECOND_ENTITY_DOWNLOAD_SEGMENT",
  "download",
)
const SCHEMA_ENTITY = readEnvironment("PW_TEST_SCHEMA_ENTITY", "Chapter")
const ADMIN_CONFIG_ROUTE = readEnvironment(
  "PW_TEST_ADMIN_CONFIG_ROUTE",
  "**/composables/admin/useAdminPanelConfig.ts*",
)
const SCHEMA_ROUTE = readEnvironment(
  "PW_TEST_SCHEMA_ROUTE",
  "**/data/api_schema.json*",
)
const EXPOSE_HIDDEN_PAGES =
  readEnvironment("PW_TEST_EXPOSE_HIDDEN_PAGES", "false") === "true"
const INTERNAL_MENU_ENABLED =
  readEnvironment("PW_TEST_INTERNAL_MENU_ENABLED", "true") === "true"
// eslint-disable-next-line security/detect-non-literal-regexp
const CHAPTER_DETAIL_HREF_PATTERN = new RegExp(
  String.raw`^/admin/endpoints/${escapeRegExp(CHAPTERS_ENTITY)}/\d+$`,
  "v",
)
// eslint-disable-next-line security/detect-non-literal-regexp
const CHAPTER_AUDIO_SRC_PATTERN = new RegExp(
  String.raw`${escapeRegExp(CHAPTERS_BASE_PATH)}\d+/${escapeRegExp(ATTACHMENT_FIELD)}/$`,
  "v",
)
// eslint-disable-next-line security/detect-non-literal-regexp
const GRID_DETAIL_HREF_PATTERN = new RegExp(
  String.raw`^/admin/endpoints/${escapeRegExp(GRID_ENTITY)}/\d+$`,
  "v",
)
// eslint-disable-next-line security/detect-non-literal-regexp
const BOOK_DOWNLOAD_HREF_PATTERN = new RegExp(
  String.raw`${escapeRegExp(BOOKS_BASE_PATH)}\d+/${escapeRegExp(DOWNLOAD_SEGMENT)}/$`,
  "v",
)
const MEASUREMENTS_ROUTE = "**/room-climate/measurements**"
const MOCK_MEASUREMENT_ID = 999_999

const SEARCH_PLACEHOLDER = "Search..."
const VIEW_ACTION = "View"
const CREATE_ACTION = "+ New"
const BACK_ACTION = "← All endpoints"
const MENU_ACTION = "Menu"
const INDEX_PLACEHOLDER = "Select an endpoint"
const CANCEL_ACTION = "Cancel"

const CUSTOM_HEADER_TEST_ID = "custom-header"
const CUSTOM_HEADER_TEXT_PREFIX = "header:"
const CUSTOM_GRID_COLUMNS = 2

const DATE_FIELD_KEY = readEnvironment(
  "PW_TEST_DATE_FIELD_KEY",
  "release_date",
)
const DATE_TIME_FIELD_KEY = readEnvironment(
  "PW_TEST_DATE_TIME_FIELD_KEY",
  "release_at",
)
const MULTISELECT_FIELD_KEY = readEnvironment(
  "PW_TEST_MULTISELECT_FIELD_KEY",
  "tags",
)
const MULTISELECT_PLACEHOLDER = readEnvironment(
  "PW_TEST_MULTISELECT_PLACEHOLDER",
  "Select tags",
)
const MULTISELECT_OPTION_LABEL = readEnvironment(
  "PW_TEST_MULTISELECT_OPTION_LABEL",
  "two",
)

const CHAPTER_FORM_LABELS = readEnvironmentList("PW_TEST_FORM_LABELS", [
  "book",
  "parent",
  "name",
  "kind",
  "is_published",
  "pages",
  "order",
  "rating",
  "attachment",
])
const READ_ONLY_CHAPTER_FIELDS = readEnvironmentList(
  "PW_TEST_READ_ONLY_FIELDS",
  ["id", "created_at", "user_id", "children"],
)

const BOOK_SELECT_PLACEHOLDER = readEnvironment(
  "PW_TEST_BOOK_SELECT_PLACEHOLDER",
  "Select a book",
)
const PARENT_SELECT_PLACEHOLDER = readEnvironment(
  "PW_TEST_PARENT_SELECT_PLACEHOLDER",
  "Select a parent chapter",
)
const CHAPTER_KIND_SELECT_PLACEHOLDER = readEnvironment(
  "PW_TEST_KIND_SELECT_PLACEHOLDER",
  "Select a chapter kind",
)
const CHAPTER_KIND_OPTION_LABEL = readEnvironment(
  "PW_TEST_KIND_OPTION_LABEL",
  "Text",
)
const NO_MATCH_SEARCH_TERM = "zz-no-match"

const AUDIO_ACCEPT = readEnvironment("PW_TEST_AUDIO_ACCEPT", "audio/*")
const PLAY_AUDIO_BUTTON_PATTERN = /^Play /v
const TEST_AUDIO_NAME = "e2e.wav"
const TEST_AUDIO_TYPE = "audio/wav"
const TEST_AUDIO_CONTENT = "e2e-audio"

const TEST_DATE_VALUE = "2026-10-20"
const TEST_DATE_TIME_VALUE = "2026-10-20T12:30"

const EXPECT_TIMEOUT_MS = 20_000
const LIST_CONTENT_TIMEOUT_MS = 60_000
const NEW_CHANGES_PATTERN = /new/v

export {
  ADMIN_CONFIG_ROUTE,
  ADMIN_INDEX_PATH,
  ADMIN_LIST_PATH,
  ADMIN_RECORD_PATH_PATTERN,
  ATTACHMENT_FIELD,
  AUDIO_ACCEPT,
  BACK_ACTION,
  BOOK_DOWNLOAD_HREF_PATTERN,
  BOOK_SELECT_PLACEHOLDER,
  BOOKS_BASE_PATH,
  BOOKS_ENTITY,
  CANCEL_ACTION,
  CHAPTER_AUDIO_SRC_PATTERN,
  CHAPTER_DETAIL_HREF_PATTERN,
  CHAPTER_FORM_LABELS,
  CHAPTER_KIND_OPTION_LABEL,
  CHAPTER_KIND_SELECT_PLACEHOLDER,
  CHAPTERS_BASE_PATH,
  CHAPTERS_ENTITY,
  CREATE_ACTION,
  CUSTOM_GRID_COLUMNS,
  CUSTOM_HEADER_TEST_ID,
  CUSTOM_HEADER_TEXT_PREFIX,
  DATE_FIELD_KEY,
  DATE_TIME_FIELD_KEY,
  DOWNLOAD_SEGMENT,
  EXPECT_TIMEOUT_MS,
  EXPOSE_HIDDEN_PAGES,
  FRONTEND_URL,
  GRID_DETAIL_HREF_PATTERN,
  GRID_ENTITY,
  INDEX_PLACEHOLDER,
  INTERNAL_MENU_ENABLED,
  LIST_CONTENT_TIMEOUT_MS,
  MEASUREMENTS_ENTITY,
  MEASUREMENTS_ROUTE,
  MENU_ACTION,
  MOCK_MEASUREMENT_ID,
  MULTISELECT_FIELD_KEY,
  MULTISELECT_OPTION_LABEL,
  MULTISELECT_PLACEHOLDER,
  NEW_CHANGES_PATTERN,
  NO_MATCH_SEARCH_TERM,
  PARENT_SELECT_PLACEHOLDER,
  PLAY_AUDIO_BUTTON_PATTERN,
  READ_ONLY_CHAPTER_FIELDS,
  SCHEMA_ENTITY,
  SCHEMA_ROUTE,
  SEARCH_PLACEHOLDER,
  TEST_AUDIO_CONTENT,
  TEST_AUDIO_NAME,
  TEST_AUDIO_TYPE,
  TEST_DATE_TIME_VALUE,
  TEST_DATE_VALUE,
  VIEW_ACTION,
}
