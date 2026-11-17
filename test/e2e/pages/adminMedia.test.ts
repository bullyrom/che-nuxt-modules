import {
  BOOK_DOWNLOAD_HREF_PATTERN,
  BOOKS_ENTITY,
  CHAPTER_AUDIO_SRC_PATTERN,
  CHAPTERS_ENTITY,
  FRONTEND_URL,
} from "../constants"
import { test } from "../fixtures"
import { TestAdminPage } from "../testing_areas/TestAdminPage"

test.describe("admin media overrides", () => {
  test("chapter list and detail render audio through the record endpoint", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(CHAPTERS_ENTITY)
    await admin.expectListAudioCollapsed()
    await admin.playListAudio(CHAPTER_AUDIO_SRC_PATTERN)

    await admin.openFirstRecord()
    await admin.expectDetail(CHAPTERS_ENTITY)
    await admin.expectDetailAudioCollapsed()
    await admin.playDetailAudio(CHAPTER_AUDIO_SRC_PATTERN)
  })

  test("book list and detail render download links", async ({ page }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(BOOKS_ENTITY)
    await admin.expectListDownload(BOOK_DOWNLOAD_HREF_PATTERN)

    await admin.openFirstRecord()
    await admin.expectDetail(BOOKS_ENTITY)
    await admin.expectDetailDownload(BOOK_DOWNLOAD_HREF_PATTERN)
  })
})
