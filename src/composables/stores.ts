import { isString } from "lodash-es"

/** A single lifecycle handler invoked on entering or leaving a page group. */
type PageLifecycleCallback = () => void

/** Minimal route object needed to detect page-group membership. */
interface RouteNameHolder {
  name?: null | string
}

/** One handler or a list of handlers for a page-group transition. */
type PageLifecycleCallbackSource =
  | PageLifecycleCallback
  | PageLifecycleCallback[]

/**
 * Normalizes an optional callback (single or list) into an array so the
 * transition logic can run every handler uniformly.
 */
function toCallbackList(
  callbacks: PageLifecycleCallbackSource | undefined,
): PageLifecycleCallback[] {
  if (callbacks === undefined) return []
  return Array.isArray(callbacks) ? callbacks : [callbacks]
}

/** Invokes every handler in order. */
function runCallbacks(callbacks: PageLifecycleCallback[]) {
  for (const callback of callbacks) callback()
}

/**
 * Runs `onEnter` once when navigation enters the given route-name group from
 * outside (including initial mount when the current route is already inside)
 * and `onLeave` once when leaving that group. Moving between pages of the group
 * triggers neither handler.
 *
 * Both handlers accept a single callback or an array of callbacks, e.g. to
 * subscribe/load on enter and unsubscribe/reset on leave.
 */
function useOnPageEnterAndLeave(
  pagesUsingData: string[],
  onEnter?: PageLifecycleCallbackSource,
  onLeave?: PageLifecycleCallbackSource,
) {
  const router = useRouter()
  const pages = new Set(pagesUsingData)

  const enterCallbacks = toCallbackList(onEnter)
  const leaveCallbacks = toCallbackList(onLeave)

  let isInsidePages = false

  function isPageInGroup(name: unknown): boolean {
    return isString(name) && pages.has(name)
  }

  function enterPages() {
    if (isInsidePages) return
    isInsidePages = true
    runCallbacks(enterCallbacks)
  }

  function leavePages() {
    if (!isInsidePages) return
    isInsidePages = false
    runCallbacks(leaveCallbacks)
  }

  router.beforeEach((to: RouteNameHolder, from: RouteNameHolder) => {
    const isEntering = isPageInGroup(to.name) && !isPageInGroup(from.name)
    const isLeaving = !isPageInGroup(to.name) && isPageInGroup(from.name)

    if (isEntering) {
      enterPages()
    } else if (isLeaving) {
      leavePages()
    }
  })

  // The initial navigation has already finished by the time this composable is
  // set up, so the router hook would never fire for a route that is already
  // inside the group — run the enter handlers manually in that case.
  if (isPageInGroup(router.currentRoute.value.name)) {
    enterPages()
  }
}

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

export {
  type PageLifecycleCallback,
  type PageLifecycleCallbackSource,
  useCallBeforeLeaveFromPage,
  useCallBeforeLeaveFromPages,
  useOnPageEnterAndLeave,
}
