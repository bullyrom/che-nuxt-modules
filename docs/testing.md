# Testing

## Layers

The library has no unit-test layer. Behavior is verified end-to-end through the
admin panel of the consuming frontend with Playwright.

- **E2E (`test/e2e`)** — a remote Chromium session drives the running frontend
  at `PW_TEST_FRONTEND_URL` (default `https://dev.87anch.local`) and asserts
  user-visible behavior. Pages that need library features the frontend does not
  configure (custom header/grid, date and multi-select fields) receive small
  test-only config/schema fragments through Playwright route interception; the
  frontend sources are never modified.

Run:

```bash
NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt yarn test:e2e
```

The config connects to the shared remote browser
(`PW_TEST_CONNECT_WS_ENDPOINT`, default `ws://playwright.87anch.local/`) with
`workers: 1` and `fullyParallel: false`. It never starts a local browser or a
`webServer`. Environment values:

- `PW_TEST_CONNECT_WS_ENDPOINT` — remote Playwright WebSocket endpoint;
- `PW_TEST_FRONTEND_URL` — target frontend origin.

## Coverage

| Area                                                                 | File                                       |
| -------------------------------------------------------------------- | ------------------------------------------ |
| Default sidebar/header, config header override and grid columns      | `test/e2e/pages/adminAreas.test.ts`        |
| `detailHref` links, direct record routes, keyed list entity switch   | `test/e2e/pages/adminStore.test.ts`        |
| Track/project-file list and detail overrides (audio, download links) | `test/e2e/pages/adminMedia.test.ts`        |
| Remote/static selects, search, audio input, date and multi-select    | `test/e2e/pages/adminFields.test.ts`       |
| List/detail realtime subscriptions, changes badge, entity switches   | `test/e2e/pages/adminRealtime.test.ts`     |

## Helpers

- `test/e2e/testing_areas/TestAdminPage.ts` — navigation, list header/detail
  and media assertions.
- `test/e2e/testing_areas/TestAdminForm.ts` — create/edit form field actions.
- `test/e2e/utils/adminConfig.ts` — test-only config/schema injection.
- `test/e2e/utils/adminApi.ts` — throwaway records and cleanup.
- `test/e2e/utils/hydration.ts` — waits until Pinia stores exist so clicks are
  not lost before hydration.

`@bullyrom/che-nuxt-modules/testing` exports the Playwright `BaseTest` used by
the page objects. It is composed, never inherited.
