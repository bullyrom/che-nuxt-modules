# Testing

## Layers

- **Unit (`vitest`)** — pure helpers, type-level compatibility and store logic.
  Run with `yarn vitest run`.
- **E2E (`test/e2e`)** — a remote Chromium session drives a running frontend
  that consumes the library and asserts user-visible admin behavior.

## E2E environment

The e2e suite is domain-agnostic: entity names, paths and schema markers come
from environment variables with generic `books`/`chapters` defaults.

```bash
cp .env.development.template .env.development
```

Fill `.env.development` with the values of your own app/OpenAPI schema.
`.env.development` is git-ignored; never commit real values. Real environment
variables win over the file, and `PW_TEST_ENV_FILE` can point to another file.

| Variable                                 | Meaning                                         | Generic default                                                    |
| ---------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| `PW_TEST_FRONTEND_URL`                   | Frontend origin under test                      | `http://localhost:3000`                                            |
| `PW_TEST_CONNECT_WS_ENDPOINT`            | Remote Playwright WebSocket endpoint            | `ws://127.0.0.1:3001/`                                             |
| `PW_TEST_MAIN_ENTITY`                    | Main list/detail entity                         | `chapters`                                                         |
| `PW_TEST_SECOND_ENTITY`                  | Second entity (download links)                  | `books`                                                            |
| `PW_TEST_MEASUREMENTS_ENTITY`            | Empty-create entity                             | `measurements`                                                     |
| `PW_TEST_MAIN_ENTITY_BASE_PATH`          | API base path of the main entity                | `/api/v1/catalog/chapters/`                                        |
| `PW_TEST_SECOND_ENTITY_BASE_PATH`        | API base path of the second entity              | `/api/v1/catalog/books/`                                           |
| `PW_TEST_MAIN_ENTITY_ATTACHMENT_FIELD`   | File/attachment field of the main entity        | `attachment`                                                       |
| `PW_TEST_SECOND_ENTITY_DOWNLOAD_SEGMENT` | Download URL segment of the second entity       | `download`                                                         |
| `PW_TEST_SCHEMA_ENTITY`                  | Schema/config name used for injected overrides  | `Chapter`                                                          |
| `PW_TEST_ADMIN_CONFIG_ROUTE`             | Playwright route of the app admin config module | `**/composables/admin/useAdminPanelConfig.ts*`                     |
| `PW_TEST_SCHEMA_ROUTE`                   | Playwright route of the app OpenAPI schema      | `**/data/api_schema.json*`                                         |
| `PW_TEST_FORM_LABELS`                    | Comma-separated create-form labels              | `book,parent,name,kind,is_published,pages,order,rating,attachment` |
| `PW_TEST_READ_ONLY_FIELDS`               | Comma-separated fields that must not render     | `id,created_at,user_id,children`                                   |
| `PW_TEST_BOOK_SELECT_PLACEHOLDER`        | Remote select placeholder                       | `Select a book`                                                    |
| `PW_TEST_PARENT_SELECT_PLACEHOLDER`      | Parent remote select placeholder                | `Select a parent chapter`                                          |
| `PW_TEST_KIND_SELECT_PLACEHOLDER`        | Static select placeholder                       | `Select a chapter kind`                                            |
| `PW_TEST_KIND_OPTION_LABEL`              | Static select option                            | `Text`                                                             |
| `PW_TEST_AUDIO_ACCEPT`                   | File input `accept`                             | `audio/*`                                                          |
| `PW_TEST_DATE_FIELD_KEY`                 | Injected date field key                         | `release_date`                                                     |
| `PW_TEST_DATE_TIME_FIELD_KEY`            | Injected date-time field key                    | `release_at`                                                       |
| `PW_TEST_MULTISELECT_FIELD_KEY`          | Injected multi-select field key                 | `tags`                                                             |
| `PW_TEST_MULTISELECT_PLACEHOLDER`        | Multi-select placeholder                        | `Select tags`                                                      |
| `PW_TEST_MULTISELECT_OPTION_LABEL`       | Multi-select option                             | `two`                                                              |

Pages that need library features the app does not configure (custom header/grid,
date and multi-select fields) receive small test-only config/schema fragments
through Playwright route interception; the app sources are never modified.

## Run

```bash
NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt yarn test:e2e
```

Build the library first (`yarn build`): the fixtures replace the app's pinned
library bundle with the local `dist/index.js`. The config connects to the remote
browser with `workers: 1` and `fullyParallel: false`; it never starts a local
browser or a `webServer`.

## Coverage

| Area                                                               | File                                   |
| ------------------------------------------------------------------ | -------------------------------------- |
| Default sidebar/header, config header override and grid columns    | `test/e2e/pages/adminAreas.test.ts`    |
| `detailHref` links, direct record routes, keyed list entity switch | `test/e2e/pages/adminStore.test.ts`    |
| Media/file list and detail overrides (audio, download links)       | `test/e2e/pages/adminMedia.test.ts`    |
| Remote/static selects, search, audio input, date and multi-select  | `test/e2e/pages/adminFields.test.ts`   |
| List/detail realtime subscriptions, changes badge, entity switches | `test/e2e/pages/adminRealtime.test.ts` |

## Helpers

- `test/e2e/utils/environment.ts` — loads `.env.development` and reads typed env
  values with generic fallbacks.
- `test/e2e/testing_areas/TestAdminPage.ts` — navigation, list header/detail
  and media assertions.
- `test/e2e/testing_areas/TestAdminForm.ts` — create/edit form field actions.
- `test/e2e/utils/adminConfig.ts` — test-only config/schema injection.
- `test/e2e/utils/adminApi.ts` — throwaway records and cleanup.
- `test/e2e/utils/hydration.ts` — waits until Pinia stores exist so clicks are
  not lost before hydration.

`@bullyrom/che-nuxt-modules/testing` exports the Playwright `BaseTest` used by
the page objects. It is composed, never inherited.
