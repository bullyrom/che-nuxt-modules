import { test } from "@playwright/test"

import {
  AUDIO_ACCEPT,
  DATE_FIELD_KEY,
  DATE_TIME_FIELD_KEY,
  FRONTEND_URL,
  MULTISELECT_FIELD_KEY,
  MULTISELECT_OPTION_LABEL,
  NO_MATCH_SEARCH_TERM,
  PARENT_SELECT_PLACEHOLDER,
  PROJECT_SELECT_PLACEHOLDER,
  TEST_AUDIO_CONTENT,
  TEST_AUDIO_NAME,
  TEST_AUDIO_TYPE,
  TEST_DATE_TIME_VALUE,
  TEST_DATE_VALUE,
  TRACK_TYPE_OPTION_LABEL,
  TRACK_TYPE_SELECT_PLACEHOLDER,
  TRACKS_ENTITY,
} from "../constants"
import { TestAdminForm } from "../testing_areas/TestAdminForm"
import { TestAdminPage } from "../testing_areas/TestAdminPage"
import {
  installAdminConfigOverrides,
  installTrackSchemaExtras,
} from "../utils/adminConfig"

const TRACK_FORM_LABELS = [
  "project",
  "parent",
  "name",
  "track_type",
  "is_melody",
  "duration_ms",
  "offset_ms",
  "gain",
  "file",
]
const READ_ONLY_TRACK_FIELDS = ["id", "created_at", "user_id", "children"]

test.describe("admin field components", () => {
  test("track form uses remote selects, a static select and an audio input", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })
    const form = new TestAdminForm(page)

    await admin.openEndpointsIndex()
    await admin.selectEntity(TRACKS_ENTITY)
    await form.openCreate(TRACKS_ENTITY)

    await form.expectLabels(TRACK_FORM_LABELS)
    await Promise.all(
      READ_ONLY_TRACK_FIELDS.map((field) => form.expectFieldAbsent(field)),
    )
    await form.expectFileAccept(AUDIO_ACCEPT)

    await form.selectFirstRemoteOption(PROJECT_SELECT_PLACEHOLDER)
    await form.selectStaticOption(
      TRACK_TYPE_SELECT_PLACEHOLDER,
      TRACK_TYPE_OPTION_LABEL,
    )
    const searchUrl = await form.searchRemoteOptions(
      PARENT_SELECT_PLACEHOLDER,
      NO_MATCH_SEARCH_TERM,
    )
    test.expect(searchUrl).toContain(`search=${NO_MATCH_SEARCH_TERM}`)

    await form.chooseFile(TEST_AUDIO_NAME, TEST_AUDIO_TYPE, TEST_AUDIO_CONTENT)
  })

  test("date, date-time and multi-select fields render from the schema config", async ({
    page,
  }) => {
    await installAdminConfigOverrides(page, { multiselectTags: true })
    await installTrackSchemaExtras(page)
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })
    const form = new TestAdminForm(page)

    await admin.openEndpointsIndex()
    await admin.selectEntity(TRACKS_ENTITY)
    await form.openCreate(TRACKS_ENTITY)

    await form.fillDateField(DATE_FIELD_KEY, TEST_DATE_VALUE)
    await form.fillDateTimeField(DATE_TIME_FIELD_KEY, TEST_DATE_TIME_VALUE)
    await form.selectMultiOption(
      MULTISELECT_FIELD_KEY,
      MULTISELECT_OPTION_LABEL,
    )
  })
})
