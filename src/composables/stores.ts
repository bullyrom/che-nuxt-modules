import { isString } from "lodash-es"

/**
 * Runs the callback when navigating from any of the given route names to a
 * route outside the set (used to `reset()` store data on leave).
 */
function useCallBeforeLeaveFromPages(
  pagesUsingData: string[],
  callback: () => void,
) {
  const router = useRouter()
  const pages = new Set(pagesUsingData)

  router.beforeEach((to, from) => {
    if (!isString(from.name) || !isString(to.name)) return
    if (pages.has(from.name) && !pages.has(to.name)) {
      callback()
    }
  })
}

/** Single-route variant of {@link useCallBeforeLeaveFromPages}. */
function useCallBeforeLeaveFromPage(
  pageUsingData: string,
  callback: () => void,
) {
  useCallBeforeLeaveFromPages([pageUsingData], callback)
}

export { useCallBeforeLeaveFromPage, useCallBeforeLeaveFromPages }
