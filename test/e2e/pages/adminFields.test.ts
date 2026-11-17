import {
  AUDIO_ACCEPT,
  BOOK_SELECT_PLACEHOLDER,
  CHAPTER_FORM_LABELS,
  CHAPTER_KIND_OPTION_LABEL,
  CHAPTER_KIND_SELECT_PLACEHOLDER,
  CHAPTERS_ENTITY,
  DATE_FIELD_KEY,
  DATE_TIME_FIELD_KEY,
  FRONTEND_URL,
  MULTISELECT_FIELD_KEY,
  MULTISELECT_OPTION_LABEL,
  NO_MATCH_SEARCH_TERM,
  PARENT_SELECT_PLACEHOLDER,
  READ_ONLY_CHAPTER_FIELDS,
  TEST_AUDIO_CONTENT,
  TEST_AUDIO_NAME,
  TEST_AUDIO_TYPE,
  TEST_DATE_TIME_VALUE,
  TEST_DATE_VALUE,
} from "../constants"
import { test } from "../fixtures"
import { TestAdminForm } from "../testing_areas/TestAdminForm"
import { TestAdminPage } from "../testing_areas/TestAdminPage"
import {
  installAdminConfigOverrides,
  installChapterSchemaExtras,
} from "../utils/adminConfig"

test.describe("admin field components", () => {
  test("chapter form uses remote selects, a static select and an audio input", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })
    const form = new TestAdminForm(page)

    await admin.openList(CHAPTERS_ENTITY)
    await form.openCreate(CHAPTERS_ENTITY)

    await form.expectLabels(CHAPTER_FORM_LABELS)
    await Promise.all(
      READ_ONLY_CHAPTER_FIELDS.map((field) => form.expectFieldAbsent(field)),
    )
    await form.expectFileAccept(AUDIO_ACCEPT)

    await form.selectFirstRemoteOption(BOOK_SELECT_PLACEHOLDER)
    await form.selectStaticOption(
      CHAPTER_KIND_SELECT_PLACEHOLDER,
      CHAPTER_KIND_OPTION_LABEL,
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
    await installChapterSchemaExtras(page)
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })
    const form = new TestAdminForm(page)

    await admin.openList(CHAPTERS_ENTITY)
    await form.openCreate(CHAPTERS_ENTITY)

    await form.fillDateField(DATE_FIELD_KEY, TEST_DATE_VALUE)
    await form.fillDateTimeField(DATE_TIME_FIELD_KEY, TEST_DATE_TIME_VALUE)
    await form.selectMultiOption(
      MULTISELECT_FIELD_KEY,
      MULTISELECT_OPTION_LABEL,
    )
  })
})
