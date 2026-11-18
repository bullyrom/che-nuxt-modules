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

    await admin.openHiddenList(CHAPTERS_ENTITY)
    await admin.expectListAudioCollapsed()
    await admin.playListAudio(CHAPTER_AUDIO_SRC_PATTERN)
  })

  test("book list and detail render download links", async ({ page }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openHiddenList(BOOKS_ENTITY)
    await admin.expectListDownload(BOOK_DOWNLOAD_HREF_PATTERN)
  })
})
