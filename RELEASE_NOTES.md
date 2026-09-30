# Release notes

- feat: export the once submodule-only composables from the package root (`useSeo`, `useStaticPage`, `useCallBeforeLeaveFromPage(s)`)
- feat: add shared `useShowLoader` and `useVoidAsyncData` composables (moved from the projects)
- feat: add `useCaptcha`, `useFirstUrlParameterOr404Error` and `useMenuStore` universal composables
- feat: add `createDefault404Error`, `scrollToFirstElementWithClass`, `divideNumber` and `valideSlug` utils
- feat: export the previously hidden UI components (`LazyLoadList`, `MainLoader`, `RollDown`, `Tabs`, `Tooltip`, `DroppingBase`, `DroppingBody`, `OverflowContainer`, `ContainerMarginRight`) and the `RequestStatus`/`Seo` types
- fix: add explicit `nextTick` import in `Slidebar.vue` — built `dist` no longer throws `ReferenceError: nextTick is not defined` outside Nuxt auto-imports
