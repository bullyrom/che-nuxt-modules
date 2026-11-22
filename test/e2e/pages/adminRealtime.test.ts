import {
  EXPECT_TIMEOUT_MS,
  FRONTEND_URL,
  MEASUREMENTS_ENTITY,
  NEW_CHANGES_PATTERN,
} from "../constants"
import { expect, test } from "../fixtures"
import { TestAdminPage } from "../testing_areas/TestAdminPage"
import { mockRealtimeSocket } from "../utils/mockRealtimeSocket"

const MOCK_REALTIME_RECORD_ID = 1

/** The backend emits the bare model name, not the `service:entity` route key. */
function realtimeEntityReference(reference: string): string {
  return reference.split(":").at(-1) ?? reference
}

test("a created record raises the list changes badge over realtime", async ({
  page,
}) => {
  await mockRealtimeSocket(
    page,
    realtimeEntityReference(MEASUREMENTS_ENTITY),
    MOCK_REALTIME_RECORD_ID,
  )

  const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })
  await admin.openList(MEASUREMENTS_ENTITY)

  await expect
    .poll(() => page.evaluate(() => document.body.dataset.realtime), {
      timeout: EXPECT_TIMEOUT_MS,
    })
    .toBe("connected")

  await expect(
    page.getByRole("button", { name: NEW_CHANGES_PATTERN }),
  ).toBeVisible({ timeout: EXPECT_TIMEOUT_MS })
})
