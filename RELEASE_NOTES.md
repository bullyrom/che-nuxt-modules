# Release notes

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
