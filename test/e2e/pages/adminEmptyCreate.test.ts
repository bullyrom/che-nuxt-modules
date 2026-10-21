import {
  FRONTEND_URL,
  MEASUREMENTS_ENTITY,
  MEASUREMENTS_ROUTE,
  MOCK_MEASUREMENT_ID,
} from "../constants"
import { expect, test } from "../fixtures"
import { TestAdminForm } from "../testing_areas/TestAdminForm"
import { TestAdminPage } from "../testing_areas/TestAdminPage"

const CREATED_MEASUREMENT = {
  co2_sensor_co2: 410,
  co2_sensor_temperature: 23,
  deviation_parameters: [],
  deviations: {},
  has_critical: false,
  has_warning: false,
  id: MOCK_MEASUREMENT_ID,
  requested_at: "2026-10-21T12:00:00Z",
  temperature_sensor_battery_percent: 85,
  temperature_sensor_humidity: 45,
  temperature_sensor_temperature: 21.5,
}

const NOT_POSTED = Symbol("not-posted")
const HTTP_STATUS_OK = 200
const HTTP_STATUS_CREATED = 201

test("creates an entity whose request schema has no writable fields", async ({
  page,
}) => {
  let hasCreatedRecord = false
  let postedBody: unknown = NOT_POSTED

  await page.route(MEASUREMENTS_ROUTE, async (route) => {
    const method = route.request().method()
    if (method === "POST") {
      const rawBody = route.request().postData()
      postedBody = rawBody === null ? undefined : JSON.parse(rawBody)
      hasCreatedRecord = true
      await route.fulfill({
        body: JSON.stringify(CREATED_MEASUREMENT),
        contentType: "application/json",
        status: HTTP_STATUS_CREATED,
      })
      return
    }
    if (method === "GET") {
      await route.fulfill({
        body: JSON.stringify(hasCreatedRecord ? [CREATED_MEASUREMENT] : []),
        contentType: "application/json",
        status: HTTP_STATUS_OK,
      })
      return
    }
    await route.continue()
  })

  const admin = new TestAdminPage({ baseUrl: FRONTEND_URL, page })
  const form = new TestAdminForm(page)

  await admin.openList(MEASUREMENTS_ENTITY)
  await form.openCreate(MEASUREMENTS_ENTITY)
  await form.expectLabels([])
  await form.expectNoRawFallback()
  await form.submitCreate()

  expect(postedBody).toEqual({})
  await admin.expectRecordIdVisible(MOCK_MEASUREMENT_ID)
})
