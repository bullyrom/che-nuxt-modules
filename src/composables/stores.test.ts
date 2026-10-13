import { beforeEach, describe, expect, it, vi } from "vitest"

import { useOnPageEnterAndLeave } from "./stores"

interface RouteStub {
  name: string | undefined
}

type NavigationGuard = (to: RouteStub, from: RouteStub) => void

const PAGES = ["list", "detail"]

// eslint-disable-next-line init-declarations
let currentRouteName: string | undefined
// eslint-disable-next-line init-declarations
let registeredGuard: NavigationGuard | undefined

const useRouterMock = vi.fn(() => ({
  beforeEach: vi.fn((guard: NavigationGuard) => {
    registeredGuard = guard
  }),
  currentRoute: {
    get value(): RouteStub {
      return { name: currentRouteName }
    },
  },
}))

function navigateTo(toName: string | undefined, fromName: string | undefined) {
  registeredGuard?.({ name: toName }, { name: fromName })
}

describe("useOnPageEnterAndLeave", () => {
  beforeEach(() => {
    currentRouteName = undefined
    registeredGuard = undefined
    useRouterMock.mockClear()
    vi.stubGlobal("useRouter", useRouterMock)
  })

  it("runs onEnter immediately when the initial route is inside the group", () => {
    currentRouteName = "list"
    const onEnter = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, vi.fn())

    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it("does not run any handler when the initial route is outside", () => {
    currentRouteName = "home"
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, onLeave)

    expect(onEnter).not.toHaveBeenCalled()
    expect(onLeave).not.toHaveBeenCalled()
  })

  it("fires onEnter once on entering and onLeave once on leaving", () => {
    currentRouteName = "home"
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, onLeave)

    navigateTo("list", "home")
    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onLeave).not.toHaveBeenCalled()

    navigateTo("home", "list")
    expect(onLeave).toHaveBeenCalledTimes(1)

    navigateTo("list", "home")
    expect(onEnter).toHaveBeenCalledTimes(2)
  })

  it("ignores transitions between pages of the group", () => {
    currentRouteName = "list"
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, onLeave)

    navigateTo("detail", "list")
    navigateTo("list", "detail")

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onLeave).not.toHaveBeenCalled()
  })

  it("accepts arrays of callbacks", () => {
    currentRouteName = "home"
    const firstEnter = vi.fn()
    const secondEnter = vi.fn()
    const firstLeave = vi.fn()
    const secondLeave = vi.fn()

    useOnPageEnterAndLeave(
      PAGES,
      [firstEnter, secondEnter],
      [firstLeave, secondLeave],
    )

    navigateTo("list", "home")
    expect(firstEnter).toHaveBeenCalledTimes(1)
    expect(secondEnter).toHaveBeenCalledTimes(1)

    navigateTo("home", "list")
    expect(firstLeave).toHaveBeenCalledTimes(1)
    expect(secondLeave).toHaveBeenCalledTimes(1)
  })

  it("treats nameless routes as outside the group", () => {
    currentRouteName = undefined
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, onLeave)

    expect(onEnter).not.toHaveBeenCalled()

    navigateTo("list", undefined)
    expect(onEnter).toHaveBeenCalledTimes(1)

    navigateTo(undefined, "list")
    expect(onLeave).toHaveBeenCalledTimes(1)
  })
})
