import {
  FRONTEND_URL,
  GRID_DETAIL_HREF_PATTERN,
  GRID_ENTITY,
  MEASUREMENTS_ENTITY,
} from "../constants"
import { expect, test } from "../fixtures"
import { TestAdminPage } from "../testing_areas/TestAdminPage"

test.describe("admin stores and embedding", () => {
  test("list View links use detailHref and the record route opens directly", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(GRID_ENTITY)
    const detailHref = await admin.firstViewHref()
    expect(detailHref).toMatch(GRID_DETAIL_HREF_PATTERN)

    await admin.openFirstRecord()
    await admin.expectDetail(GRID_ENTITY)

    await admin.openPath(detailHref)
    await admin.expectDetail(GRID_ENTITY)
  })

  test("switching entities reuses the keyed list without stale records", async ({
    page,
  }) => {
    const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })

    await admin.openList(GRID_ENTITY)
    await admin.expectListUrl(GRID_ENTITY)

    await admin.selectEntity(MEASUREMENTS_ENTITY)
    await admin.expectListUrl(MEASUREMENTS_ENTITY)

    await admin.selectEntity(GRID_ENTITY)
    await admin.expectListUrl(GRID_ENTITY)
  })
})
