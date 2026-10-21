import { test } from "@playwright/test"

import {
  CUSTOM_GRID_COLUMNS,
  FRONTEND_URL,
  RECORD_NAMESPACE,
  TRACKS_BASE_PATH,
  TRACKS_ENTITY,
} from "../constants"
import { TestAdminPage } from "../testing_areas/TestAdminPage"
import { installAdminConfigOverrides } from "../utils/adminConfig"

test.describe("admin areas", () => {
  test("default sidebar and header drive the entity list", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openEndpointsIndex()
    await admin.expectSidebarGroup(RECORD_NAMESPACE)
    await admin.selectEntity(TRACKS_ENTITY)
    await admin.expectDefaultHeader(TRACKS_ENTITY, TRACKS_BASE_PATH)
    await admin.backToIndex()
  })

  test("config replaces the list header and grid columns", async ({
    page,
  }) => {
    await installAdminConfigOverrides(page, {
      customHeader: true,
      gridColumns: CUSTOM_GRID_COLUMNS,
    })
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openEndpointsIndex()
    await admin.selectEntity(TRACKS_ENTITY, { customHeader: true })
    await admin.expectCustomHeader(TRACKS_ENTITY)
    await admin.expectGridColumns(CUSTOM_GRID_COLUMNS)
  })
})
