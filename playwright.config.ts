import { defineConfig } from "@playwright/test"

const DEFAULT_FRONTEND_URL = "https://dev.87anch.local"
const DEFAULT_WS_ENDPOINT = "ws://playwright.87anch.local/"
const TEST_TIMEOUT_MS = 180_000
const EXPECT_TIMEOUT_MS = 20_000
const VIEWPORT_WIDTH = 1440
const VIEWPORT_HEIGHT = 900

const wsEndpoint =
  process.env.PW_TEST_CONNECT_WS_ENDPOINT ?? DEFAULT_WS_ENDPOINT
const baseURL = process.env.PW_TEST_FRONTEND_URL ?? DEFAULT_FRONTEND_URL

export default defineConfig({
  expect: { timeout: EXPECT_TIMEOUT_MS },
  fullyParallel: false,
  reporter: [["list"]],
  retries: 0,
  testDir: "./test/e2e",
  timeout: TEST_TIMEOUT_MS,
  use: {
    baseURL,
    connectOptions: { wsEndpoint },
    ignoreHTTPSErrors: true,
    viewport: { height: VIEWPORT_HEIGHT, width: VIEWPORT_WIDTH },
  },
  workers: 1,
})
