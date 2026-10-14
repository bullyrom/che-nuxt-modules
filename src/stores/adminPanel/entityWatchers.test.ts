import { describe, expect, it, vi } from "vitest"
import { effectScope, nextTick, ref, watch } from "vue"

/**
 * Reproduces why the admin filter watchers must live in the *store's* effect
 * scope and not in a component lifecycle hook: a component-scoped watcher is
 * disposed when that component unmounts (leaving the store for entity A), so on
 * the next visit the memoized store would have no working filter watcher.
 */
describe("store watcher scope", () => {
  it("setup-scope watchers survive the component scope disposal", async () => {
    const filter = ref(0)
    const storeReload = vi.fn()
    const componentReload = vi.fn()

    const storeScope = effectScope()
    const componentScope = effectScope()

    storeScope.run(() => watch(filter, storeReload))
    componentScope.run(() => watch(filter, componentReload))

    filter.value += 1
    await nextTick()
    expect(storeReload).toHaveBeenCalledTimes(1)
    expect(componentReload).toHaveBeenCalledTimes(1)

    // The component that first created the store unmounts.
    componentScope.stop()
    filter.value += 1
    await nextTick()

    // The store keeps working, the component-scoped watcher does not.
    expect(storeReload).toHaveBeenCalledTimes(2)
    expect(componentReload).toHaveBeenCalledTimes(1)

    storeScope.stop()
  })
})
