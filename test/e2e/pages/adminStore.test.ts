import { expect, test } from "@playwright/test"

import {
  FRONTEND_URL,
  PROJECT_FILE_DOWNLOAD_HREF_PATTERN,
  PROJECT_FILES_ENTITY,
  TRACK_AUDIO_SRC_PATTERN,
  TRACK_DETAIL_HREF_PATTERN,
  TRACKS_ENTITY,
} from "../constants"
import { TestAdminPage } from "../testing_areas/TestAdminPage"

test.describe("admin stores and embedding", () => {
  test("list View links use detailHref and the record route opens directly", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(TRACKS_ENTITY)
    const detailHref = await admin.firstViewHref()
    expect(detailHref).toMatch(TRACK_DETAIL_HREF_PATTERN)

    await admin.openFirstRecord()
    await admin.expectDetail(TRACKS_ENTITY)

    await admin.openPath(detailHref)
    await admin.expectDetail(TRACKS_ENTITY)
  })

  test("switching entities reuses the keyed list without stale records", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(TRACKS_ENTITY)
    await admin.expectListAudio(TRACK_AUDIO_SRC_PATTERN)

    await admin.selectEntity(PROJECT_FILES_ENTITY)
    await admin.expectListUrl(PROJECT_FILES_ENTITY)
    await admin.expectListDownload(PROJECT_FILE_DOWNLOAD_HREF_PATTERN)

    await admin.selectEntity(TRACKS_ENTITY)
    await admin.expectListUrl(TRACKS_ENTITY)
    await admin.expectListAudio(TRACK_AUDIO_SRC_PATTERN)
  })
})
