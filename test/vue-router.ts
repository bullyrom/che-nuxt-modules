/**
 * Minimal `vue-router` stub for unit tests. `vue-router` is a peer dependency
 * (provided by Nuxt at runtime) and is not installed in this package, so the
 * Vitest config aliases the bare specifier here.
 */

interface RouteNameHolder {
  name?: null | string
}

type NavigationGuard = (to: RouteNameHolder, from: RouteNameHolder) => void

const routerState: { currentName?: string; guard?: NavigationGuard } = {}

function useRouter() {
  return {
    beforeEach(navigationGuard: NavigationGuard) {
      routerState.guard = navigationGuard
    },
    currentRoute: {
      get value(): RouteNameHolder {
        return { name: routerState.currentName }
      },
    },
  }
}

/** Test helper: sets the route the mock router currently reports. */
function setMockCurrentRoute(name: string | undefined) {
  routerState.currentName = name
}

/** Test helper: triggers the registered navigation guard. */
function navigateMockRouter(
  toName: string | undefined,
  fromName: string | undefined,
) {
  routerState.guard?.({ name: toName }, { name: fromName })
}

/** Test helper: resets the mock router between tests. */
function resetMockRouter() {
  routerState.currentName = undefined
  routerState.guard = undefined
}

export { navigateMockRouter, resetMockRouter, setMockCurrentRoute, useRouter }
