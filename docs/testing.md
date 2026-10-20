# Testing

## Layers

- **Behavior tests (`test/unit`)** — external tests. They import only the
  public package API (`src/index.ts`), mount the real components with Vue +
  Pinia in a `happy-dom` environment and assert rendered output, emitted values
  and store side effects. They intentionally do not import private helpers.
- **Focused tests (`src/**/\*.test.ts`)\*\* — small unit tests for pure helpers
  (config converters, date conversion, realtime pool, query parameters).

Run everything:

```bash
yarn test          # vitest run
yarn test:watch    # watch mode
```

## External coverage

| Area                                                                                                               | File                                         |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Form override (`hiddenFields`, typed `onChange`), `fields.formats`, `defaultComponents`, `fields.overrides`        | `test/unit/admin-form-customization.test.ts` |
| List item override, `views.list`/`listHeader`/`listFooter`, header override, grid columns                          | `test/unit/admin-list-customization.test.ts` |
| Detail override (including all fields hidden), `views.detail`, `menu.hiddenEntities`/`extraLinks`, `views.sidebar` | `test/unit/admin-detail-menu.test.ts`        |
| Keyed list/detail/form stores, config fragments, `detailHref`/`showDetail`, realtime list/detail wiring            | `test/unit/admin-keyed-stores.test.ts`       |
| `Select`/`MultiSelect`, `RemoteSelect`/`RemoteMultiSelect` (flat array, paginated envelope, search)                | `test/unit/field-selects.test.ts`            |
| Media values/fields and `DateField`/`DateTimeField`                                                                | `test/unit/field-media-date.test.ts`         |

## Helpers

- `test/unit/helpers/mount.ts` — fresh Pinia + mount/unmount, `click`,
  `typeInto`, `flush`, `waitFor`.
- `test/unit/helpers/adminFixtures.ts` — small OpenAPI document, parsed entity,
  records and a `fetch` stub that returns paginated and detail responses.
- `test/unit/helpers/customComponents.ts` — the override components used by the
  admin tests (`CapturedGroup`, `ListGroup`, `CustomSidebar`, ...).

The fetch stub replaces `globalThis.fetch` (the admin data layer uses `ofetch`),
so tests assert real request URLs and query parameters without a server.

## Playwright

`@bullyrom/che-nuxt-modules/testing` exports the Playwright `BaseTest` used by
host applications for e2e tests. It connects to the shared remote Chromium
server and is documented in the project rules (`playwright.md`). The library
itself has no application to drive, so its own behavior tests run through
Vitest; `BaseTest` is exercised by the consuming project's e2e suite.
