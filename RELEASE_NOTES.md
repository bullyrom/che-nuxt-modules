# Release notes

- fix(admin): treat the server-idle list state as loading so SSR and hydration render the same loader (no hydration mismatch on the measurements page)
- fix(admin): create forms for request schemas without writable fields render no fields (just the Create action) and POST an empty body instead of the raw-schema fallback
- fix(components): audio values stay collapsed behind a play button with a track label until clicked, so `<audio>` is not rendered for every record; `AudioField` passes its label to the current media
- fix: admin list fetches its first page on mount again (the keyed-store refactor dropped the initial load, leaving the panel empty until a filter or reload)
- fix: list realtime channel follows the entity switch even though the admin reuses one instance key
- fix: remote selects use the unwrapped options store values and forward the search term, so options render and search requests carry `search`
- fix: the detail group still renders when `detailOverride.hiddenFields` hides every field
- fix: `fields.overrides` resolves the request-body schema name for inline OpenAPI `requestBody` definitions
- test: external Playwright e2e suite (`test/e2e`) against the running admin frontend, driving the shared remote Chromium browser
- docs: added `docs/testing.md` and documented the select search binding, fully-hidden detail groups and request-body override lookup

- feat: reusable `Select`/`MultiSelect` (presentational) and `RemoteSelect`/`RemoteMultiSelect` (options loaded through a keyed Pinia store built on `usePaginatedListApi`, handling both a flat array and the Django paginated envelope) with search, paginated `LazyLoadList` loading and typed `labelKey`/`valueKey`; plus `toSelectOptions`, `useRemoteSelectOptions`, `useSelectOptionsStore`/`getSelectOptionsStore`, `SelectOption` and the shared select styles
- feat: media field components for the admin field API — `FileField` (on `FileInput`), `ImageField`/`AudioField`/`VideoField` (current media + replace input) and display-only `ImageValue` (link + hover preview), `AudioValue`, `VideoValue`
- feat: date field components `DateField`/`DateTimeField` (ISO strings, timezone-safe) with `DEFAULT_FORMAT_COMPONENTS` mapping `date`/`date-time` automatically
- feat: format-based field dispatch — `AdminPanelFieldConfig.formats` (OpenAPI `format` -> component) is resolved before the kind `defaultComponents`, threaded through `FieldRenderer`/`QueryParametersMenu`/`EntityCreateForm` and the render context
- refactor: moved `createInstanceRegistry` to `src/stores/instanceRegistry.ts` so it is shared by the admin instance stores and the new select options store
- docs: added `docs/components.md` (selects, media/date field components, field-API wiring, project wrappers) and referenced it from the README; documented `fields.formats`
- chore: added the "future admin package" architecture rule to `AGENTS.md`
- test: unit tests for `toSelectOptions` and the date-input helpers

- feat: `AdminPanelConfig` is now generic over an entity-name→object-type map, so per-entity override components and their typed `value`/`onChange` are checked against the generated OpenAPI types
- feat: whole-object field-group overrides (level 1) for the create/edit form, list items and record detail — `entities.<name>.formOverride|listItemOverride|detailOverride` with `hiddenFields` plus a component that receives the whole object and a typed `onChange` setter (standard fields keep rendering before it)
- feat: full list/detail overrides (`views.list`/`views.detail`) and partial `views.listHeader`/`views.listFooter` wrapping the default list — components receive records, `fetchNextPage`, next/previous URL, count, status, grid columns and `reload`
- feat: grid columns (level 3) configurable globally (`gridColumns`) and per entity via `entities.<name>.gridColumns`
- feat: header override (level 4) via `views.header`, receiving `entity`, `canCreate`, `listChangesCount`, `startCreate`, `reload` and `clearEntity`
- feat: sidebar override (level 5) via `views.sidebar`, plus the gentler `menu.hiddenEntities` and `menu.extraLinks` tweaks on the default menu
- feat: admin pieces are now keyed dictionaries — the global `useAdminPanelStore` holds the one shared config + schema, and `useAdminPanelListStore`/`useAdminPanelDetailStore`/`useAdminPanelFormStore` are per-`instanceKey` stores; the admin reuses `admin-1` for every entity, while an embedded piece uses its own key and creates only its own dictionary entry (other entries and the global config are untouched)
- feat: an embedded list takes `detailHref` to build detail links (the `View` action becomes a link); with no `detailHref` and no `showDetail` the detail action is hidden — the normal admin generates its own links
- feat: per-component config fragments `AdminListConfig`/`AdminDetailConfig`/`AdminFormConfig` with the converters `listConfigToPanelConfig`/`detailConfigToPanelConfig`/`formConfigToPanelConfig`, so embedded pieces only receive the config slice they need
- feat: exported `EntityWorkspace`, `EntityRecordList`, `EntityListHeader`, `EntityDeleteModal`, `FieldGroupRenderer`, `ListElementByCurrentDevice`, the fragment types/converters and the keyed store accessors
- refactor: replaced the per-entity `useAdminPanelEntityStore` with the keyed list/detail/form stores (deleted `entity.ts`/`entityList.ts`/`entityForm.ts`); the realtime helper gained `list`/`detail` modes for the split stores
- docs: added `docs/admin-customization.md` covering every customization level, embedding outside the admin and the store structure
- test: added unit tests for the config-fragment converters

- feat: `@bullyrom/che-nuxt-modules/testing` exposes a Playwright 1.64 `BaseTest` port of the old technical methods (`pageClick`, page text/selector assertions, ordered text, `goToBaseUrl`/`goToPath`, Vue-select helpers, lazy loading, drag-and-drop, filter check); old dotenv/coordinate/timeout coupling is replaced by options, locators and Playwright auto-wait, and `pageRootSelector` defaults to `#__nuxt`
- fix: admin list filters work again on every entity — the `searchQuery`/`queryValues` watchers are registered in the store's own effect scope instead of `onMounted`, so they survive entity switches and component remounts (a memoized store no longer loses its watchers)
- fix: `searchQuery`/`queryValues` are marked `skipHydrate`, so Pinia restoring the store no longer looks like a filter change — no false reload on hydration
- test: added a scope-lifecycle regression test (`entityWatchers.test.ts`) reproducing why the watchers must live in the store scope

- fix: the root-level OpenAPI admin nested `RollDown` now has horizontal padding (`px-3`) so the arrow and the summary are not flush with the edges (nested levels unchanged)
- fix: empty arrays/objects keep the same card/header design as non-empty collections but without a `RollDown`, labelled `0 items` / `0 fields`
- fix: the record/model title on the OpenAPI admin detail page is right-aligned again — the detail root spans the full pane
- test: `RecordEntry` SSR test now covers empty collections rendering the collection card

- fix: OpenAPI admin nested field labels are English again (`N items` / `N fields · identifier`) and the type summary is right-aligned in the RollDown header
- fix: `RecordEntry` no longer renders a (empty) `RollDown` for empty arrays/objects — they fall back to the raw-value row
- style: nested OpenAPI admin children are visually separated by a distinct card background and a left guide line
- test: added an SSR test for `RecordEntry` (English labels, no `RollDown` for empty collections)

- fix: the admin entity store no longer refetches right after hydration — the filter/search watchers are now registered in `onMounted` (client, after Pinia restored the state), so the fresh `queryValues` object Pinia assigns during hydration is not mistaken for a filter change. This removes the SSR-data → loader → data double load and the `LazyLoadList` hydration mismatch it caused (the loader `v-if` comment vs div)

- fix: `LazyLoadList` no longer emits `v-if` comment anchors (`<!---->`) between the items — the visibility trigger is now bound to the trigger item's wrapper with a function ref instead of a sibling `v-if` node, so the server (`@vue/server-renderer`) and the client render the same list markup; added an SSR regression test (`LazyLoadList.ssr.test.ts`) that renders the component and the admin `EntityRecordCard` slot

- fix: `LazyLoadList` is hydration-safe — the visibility observers now attach in `onMounted` (client only) via `useElementVisibility` instead of the `v-element-visibility` directive, so the server and the client render identical markup (the server no longer emits a placeholder comment where the client renders a node)
- fix: the admin entity-store registry is scoped to the active Pinia (per SSR request / per client app) instead of a module-level map, so entity stores no longer leak between requests; `ListElementByCurrentDevice` became a thin wrapper over `EntityRecordList` and only creates a store for the active entity — no placeholder/extra-entity store is created

- refactor: all OpenAPI-admin data now lives in a Pinia store — `useAdminPanelEntityStore` (one store per entity, built on `usePaginatedListApi`/`useDetailApi`/`useFormApi`/`useApiDelete`/`useApiUpdate`) with list, filters, view, detail, create/edit form and delete state plus computed derivations; components (`ListElementByCurrentDevice`, `EntityRecordDetail`, `EntityCreateForm`) read it via `storeToRefs` and hold no data themselves
- refactor: removed the `admin-panel-records` mirror store, `useEntityRecordListState`, `useEntityRecordList`/`useEntityRecordDeletion` composables and the `entitySelectionNonce`; sidebar `selectEntity` now closes the open record view explicitly, hydration comes from the Pinia payload (no `onMounted` reload / same-entity guard), and realtime stays client-only and mutates the store

- fix: the admin list paginated state is now mirrored into a Pinia store (`admin-panel-records`) so it is part of the Nuxt payload and hydrates — the server-rendered list is reused on the client with no loader flash, no double fetch and no hydration mismatch (the `onMounted` "reload if empty" workaround is gone)
- fix: selecting an entity in the admin sidebar (including re-clicking the already active one) closes an open record view and returns to the list (`entitySelectionNonce` / `requestEntityViewReset`)

- fix: the admin list no longer auto-reloads on realtime changes (it kept clearing the server-rendered list and flashing "No data"); the entity-switch watcher now ignores a re-assigned identical entity so hydration is preserved, and the client fetches the list after mount when the server data was not part of the payload
- feat: admin list realtime `changed` events now increment a "new changes" badge (`listChangesCount`) instead of reloading — clicking the badge reloads the list with the user's current filters; the open record still refetches automatically

- fix: SSR data loading in the admin is restored — only realtime subscriptions and the event-driven refetch are client-only, detected with `typeof window` (the `import.meta.client` constant is not rewritten inside a pre-built package consumed from `node_modules`); the realtime subscription now starts in `onMounted` so no socket event can change the data before hydration
- feat: realtime room identity is configurable — `AdminPanelConfig.realtimeEntityName` maps a parsed OpenAPI entity to the backend identifier (`model._meta.label_lower`, e.g. `record.recordproject`), with the `resolveRealtimeEntityName` helper and `AdminRealtimeEntityName` type exported; defaults to `entity.entityName`

- fix: the library no longer relies on Nuxt auto-imports for `useRouter` — `useOnPageEnterAndLeave` / `useCallBeforeLeaveFromPages` import it explicitly from `vue-router` (added as a peer dependency and kept external in the build), so `useRouter is not defined` no longer happens when consumed as an npm package
- fix: admin realtime is strictly client-only (`import.meta.client`) — subscriptions and change-driven refetch never run during SSR, so the detail no longer fetches an empty URL and the server/client markup stays in sync

- feat: realtime in the OpenAPI admin via an injected, dependency-free client (`AdminPanelConfig.realtime`) — the list follows `entity:<model>` and reloads, the open record follows `entity:<model>:<id>` and refetches (subscribe/unsubscribe in `startView`/`closeView`); channels are reference-counted and released on unmount; exported `AdminRealtimeClient`/`AdminRealtimeChange`/`AdminRealtimeHandler`/`AdminRealtimeSubscriptions` types, the `entityListChannel`/`entityDetailChannel` helpers, `getAdminRealtime`, `createRealtimeSubscriptions` and `getRecordId`; the list composable is split into realtime and deletion helpers

- feat: add `useOnPageEnterAndLeave(pages, onEnter, onLeave)` — fires `onEnter` once when entering a route-name group from outside (including the initial route already inside) and `onLeave` once when leaving it, ignores moves between pages of the group and accepts single callbacks or arrays; the existing `useCallBeforeLeaveFromPages` is untouched

- feat: export `EntityCreateForm` from the package root — the single admin form that handles both create and edit (via its `editRecord` prop), so the paginated admin list can add/change records again

- feat: export the admin page-building pieces from the package root — `SidebarEndpointsMenu`, `EntityRecordCard`, `EntityRecordDetail` and `useEntityRecordList` (alongside the existing `Crud`/`MasterDetail`) so the frontend can assemble the paginated `/admin/endpoints/...` routes

- fix: give the admin `MasterDetail` boolean props explicit `undefined` defaults so an absent `isMobile`/`splitOnWideScreen` is not cast to `false` by Vue — wide screens get the two-pane layout again (records fetch, mobile menu is full width) while mobile keeps the single-pane drill-down

- feat: reusable `MasterDetail` component + `useMasterDetail` composable in the admin module — a routing-free, client-state master-detail mechanism that swaps the entity menu and the working area (and the record list and the record detail) on small screens while keeping both panes side by side on wide screens
- fix: the OpenAPI admin no longer sets its own outer spacing — removed the root `p-3` and the hard-coded header height (`h-[calc(100vh-56px)]` → `h-full`), so the host page owns the outer margins and the height while the admin keeps only its inner spacing
- style: modernized the admin Endpoints sidebar — dropped the per-row borders (Excel-like underlines), grouped each namespace into a spaced section and switched the active entity to a rounded accent-highlighted item

- fix: switching entities in the OpenAPI admin now shows old records → loader → new records (previously the stale cards stayed under a pagination spinner and the entity/filter reset fired a duplicate request); the previous entity records are cleared on switch and the programmatic search/filter reset no longer schedules an extra fetch
- feat: mobile OpenAPI admin layout — the endpoints menu fills the screen until an entity is picked, then the entity list takes over (the `← All endpoints` button returns to the menu); the `isMobile` prop still overrides the breakpoint auto-detection (`md`)
- feat: add a single-record detail view to the OpenAPI admin — a `View` button on each list card opens the full record fetched from the entity's GET detail endpoint (with a back button and a fallback to the list row when no detail endpoint exists)
- fix: nested object cards in the OpenAPI admin add a minimal (6px) padding only inside child cards, restoring the main record card layout; nested `RollDown`s now drop their subtree from the DOM after collapsing (deep trees no longer lag) and the header shows an identifier (`object id <N>`, or another field when no id) instead of a field count
- feat: OpenAPI admin GET-parameter filter/sort inputs are now debounced with lodash (trailing 300ms, edits within the window merged) so the list request fires once per pause; the separate search box keeps its own debounce
- fix: nested object blocks in the OpenAPI admin have consistent internal padding at every nesting level (padding is applied per row/button instead of per nesting tier, so it never accumulates with depth)
- feat: OpenAPI admin list panel now renders query-parameter menus (filters + a separate sorting group) derived from the list endpoint's OpenAPI `parameters`, with controls typed from their schemas (enum → select, number/boolean/string → matching input) applied to the list request
- feat: admin query controls reuse the field system (`FieldDescriptor`/`FieldRenderer`); added `EnumField` so schema `enum` fields render as `<select>` in both query menus and create/edit forms
- feat: the admin list no longer hardcodes `search` — it uses the schema-declared `search` query parameter when the endpoint provides one, keeping the standalone search box only as a fallback
- chore: enable `@vitejs/plugin-vue` in the vitest config and add unit tests for list query-parameter extraction and query building
- feat: nested objects in the OpenAPI admin (list records and edit form) are now rendered as collapsed blocks with the library `RollDown` button — each nested object expands in place under its own key with no cumulative horizontal indent, recursively at any depth
- fix: OpenAPI admin never renders blank output — non-list responses (e.g. `/api/v1/schema/`) and unrenderable objects/arrays are shown as pretty, truncated JSON, while long/binary strings are truncated; create forms fall back to the raw schema when no fields can be derived (`usePaginatedListApi` now exposes `rawData`)
- fix: `usePaginatedListApi` rewrites `next`/`previous` to the list request origin, so a backend behind a TLS proxy (DRF emits `http://`) no longer causes mixed-content failures on pagination
- fix: `usePaginatedListApi` now also accepts a plain array response (non-paginated endpoints), so the admin list no longer renders empty
- fix: `useCallBeforeLeaveFromPage(s)` called `isString` without importing it (runtime `ReferenceError`)
- refactor: `useApiUpdate`/`useApiDelete` now share one keyed-mutation helper; both (and `useFormApi.sendForm`) accept a per-call `url`/`method` override
- refactor: `DroppingBase` wraps `Dropdown`; `Tabs` uses the local `ContainerMarginRight` and VueUse breakpoints instead of the hidden `nuxt-viewport` dependency
- refactor: admin panel reuses library pieces — `usePaginatedListApi` (list), `useApiDelete` (delete), `useFormApi` (create/edit form), `CheCheckbox` (boolean fields); remove dead `EntityOperationsList.vue` and `stores/adminPanel/pathHandlers.ts`
- fix: `stores/pages.ts` no longer imports the project-only `@/types/base` / `ApiStaticPage` types
- chore: drop the deprecated `hid` meta key in `useSeo`
- feat: add the field components `InputWithUnits` (numeric input + unit suffix) and `PasswordInput` (labeled input with show/hide toggle)
- feat: add the dependency-free `TypingIndicator` chat "typing…" component
- feat: add `useCalendar` reactive month/day calendar state (from psite's `useCheCalendar`) and `useCurrentTimeZone`
- feat: add `getCurrentTimeZoneOffsetHours`, `getIsoDateWithFirstDayInMonth` and `getIsoDateWithLastDayInMonth` date utils
- feat: add social-share link builders `odnoklassnikiShareLink`, `vkontakteShareLink`, `telegramShareLink`
- feat: add form option utils `choicesToRadioOptions` and `baseCheckboxInfo` (with `RadioOption`/`BaseCheckboxParameters` types)
- feat: add universal `chunkArray` array util
- fix: correct the `distance` prop default typo (`defautl`) in `Dropdown`, `DroppingBody`, `DroppingBase` and `Tooltip`
- fix: `Slidebar` background animation was assigned to the body animation ref, so it was never paused/tracked
- refactor: split `DroppingBody` position helpers to satisfy complexity rules; drop magic numbers in `RollDown`
- feat: add universal `dateRussianFormatString`, `monthName`, `previousMonth`, `nextMonth`, `daysInDatesAreTheSame`, `getWeeksInMonth` (and the `Week` type), `getCurrentTimeZoneCityName` date utils
- feat: add universal `filterObjectByKeys`, `clearObjectFields`, `objectValuesToString` object utils
- feat: add universal `useGetI18nListValues` (numbered i18n families) and `useScrollToTop` composables
- feat: add the generic `ErrorsList` component (renders a plain `string[]` next to a form field)
- fix: `divideNumber` no longer mangles already-formatted/exponential strings (regression) while keeping correct fraction handling
- refactor: widen `useRender` render-callback type to `() => unknown` so any TSX return shape is accepted
- feat: export the once submodule-only composables from the package root (`useSeo`, `useStaticPage`, `useCallBeforeLeaveFromPage(s)`)
- feat: add shared `useShowLoader` and `useVoidAsyncData` composables (moved from the projects)
- feat: add `useCaptcha`, `useFirstUrlParameterOr404Error` and `useMenuStore` universal composables
- feat: add `createDefault404Error`, `scrollToFirstElementWithClass`, `divideNumber` and `valideSlug` utils
- feat: export the previously hidden UI components (`LazyLoadList`, `MainLoader`, `RollDown`, `Tabs`, `Tooltip`, `DroppingBase`, `DroppingBody`, `OverflowContainer`, `ContainerMarginRight`) and the `RequestStatus`/`Seo` types
- fix: add explicit `nextTick` import in `Slidebar.vue` — built `dist` no longer throws `ReferenceError: nextTick is not defined` outside Nuxt auto-imports
- feat: OpenAPI admin panel (`Crud`) now ships default `notes`-style theming — dark by default with a light variant, driven by CSS variables (palette `#161616`/`#242424`/`#fafafa`/`#aeaeae`/`#3b5cf6`, radii 4/8/12)
- feat: `AdminPanelConfig.theme` accepts a reactive value (`ref`/`computed`/getter) supplied by the host app; the library no longer needs `@nuxtjs/color-mode`
- fix: admin theme now reacts to the reactive `theme` source (incl. a top-level `theme` prop) and unknown values fall back to dark instead of dropping the palette
- fix: admin corner radii restored with the standard Tailwind scale (`rounded` 4 / `rounded-lg` 8 / `rounded-xl` 12) so they render regardless of arbitrary-value generation
- style: OpenAPI admin working area and entity sidebar are now bordered, rounded panels floating on the page background
- style: admin action buttons use the neutral dark-surface style (border + page surface) instead of the blue accent, matching the front sidebar menu
- style: drop the redundant `GET` badge from the admin entity sidebar rows
