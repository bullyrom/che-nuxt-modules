import { test } from "@playwright/test"

import {
  FRONTEND_URL,
  PROJECT_FILE_DOWNLOAD_HREF_PATTERN,
  PROJECT_FILES_ENTITY,
  TRACK_AUDIO_SRC_PATTERN,
  TRACKS_ENTITY,
} from "../constants"
import { TestAdminPage } from "../testing_areas/TestAdminPage"

test.describe("admin media overrides", () => {
  test("track list and detail render audio through the record endpoint", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(TRACKS_ENTITY)
    await admin.expectListAudioCollapsed()
    await admin.playListAudio(TRACK_AUDIO_SRC_PATTERN)

    await admin.openFirstRecord()
    await admin.expectDetail(TRACKS_ENTITY)
    await admin.expectDetailAudioCollapsed()
    await admin.playDetailAudio(TRACK_AUDIO_SRC_PATTERN)
  })

  test("project file list and detail render download links", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(PROJECT_FILES_ENTITY)
    await admin.expectListDownload(PROJECT_FILE_DOWNLOAD_HREF_PATTERN)

    await admin.openFirstRecord()
    await admin.expectDetail(PROJECT_FILES_ENTITY)
    await admin.expectDetailDownload(PROJECT_FILE_DOWNLOAD_HREF_PATTERN)
  })
})
