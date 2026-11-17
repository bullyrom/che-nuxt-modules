import {
  BOOK_DOWNLOAD_HREF_PATTERN,
  BOOKS_ENTITY,
  CHAPTER_DETAIL_HREF_PATTERN,
  CHAPTERS_ENTITY,
  FRONTEND_URL,
} from "../constants"
import { expect, test } from "../fixtures"
import { TestAdminPage } from "../testing_areas/TestAdminPage"

test.describe("admin stores and embedding", () => {
  test("list View links use detailHref and the record route opens directly", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(CHAPTERS_ENTITY)
    const detailHref = await admin.firstViewHref()
    expect(detailHref).toMatch(CHAPTER_DETAIL_HREF_PATTERN)

    await admin.openFirstRecord()
    await admin.expectDetail(CHAPTERS_ENTITY)

    await admin.openPath(detailHref)
    await admin.expectDetail(CHAPTERS_ENTITY)
  })

  test("switching entities reuses the keyed list without stale records", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(CHAPTERS_ENTITY)
    await admin.expectListAudioCollapsed()

    await admin.selectEntity(BOOKS_ENTITY)
    await admin.expectListUrl(BOOKS_ENTITY)
    await admin.expectListDownload(BOOK_DOWNLOAD_HREF_PATTERN)

    await admin.selectEntity(CHAPTERS_ENTITY)
    await admin.expectListUrl(CHAPTERS_ENTITY)
    await admin.expectListAudioCollapsed()
  })
})
