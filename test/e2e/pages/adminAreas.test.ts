import {
  CHAPTERS_BASE_PATH,
  CHAPTERS_ENTITY,
  CUSTOM_GRID_COLUMNS,
  FRONTEND_URL,
  GRID_ENTITY,
} from "../constants"
import { test } from "../fixtures"
import { TestAdminPage } from "../testing_areas/TestAdminPage"
import { installAdminConfigOverrides } from "../utils/adminConfig"

test.describe("admin areas", () => {
  test("index placeholder and the site menu drive the entity list", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openEndpointsIndex()
    await admin.selectEntity(CHAPTERS_ENTITY)
    await admin.expectDefaultHeader(CHAPTERS_ENTITY, CHAPTERS_BASE_PATH)
    await admin.backToIndex()
  })

  test("hides the back action when the internal menu is disabled", async ({
    page,
  }) => {
    await installAdminConfigOverrides(page, { hideInternalMenu: true })
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(GRID_ENTITY)
    await admin.expectBackActionHidden()
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
    await admin.selectEntity(GRID_ENTITY, { customHeader: true })
    await admin.expectCustomHeader(GRID_ENTITY)
    await admin.expectGridColumns(CUSTOM_GRID_COLUMNS)
  })
})
