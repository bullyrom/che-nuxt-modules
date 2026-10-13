import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  navigateMockRouter,
  resetMockRouter,
  setMockCurrentRoute,
} from "../../test/vue-router"

import { useOnPageEnterAndLeave } from "./stores"

const PAGES = ["list", "detail"]

describe("useOnPageEnterAndLeave", () => {
  beforeEach(() => {
    resetMockRouter()
  })

  it("runs onEnter immediately when the initial route is inside the group", () => {
    setMockCurrentRoute("list")
    const onEnter = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, vi.fn())

    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it("does not run any handler when the initial route is outside", () => {
    setMockCurrentRoute("home")
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, onLeave)

    expect(onEnter).not.toHaveBeenCalled()
    expect(onLeave).not.toHaveBeenCalled()
  })

  it("fires onEnter once on entering and onLeave once on leaving", () => {
    setMockCurrentRoute("home")
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, onLeave)

    navigateMockRouter("list", "home")
    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onLeave).not.toHaveBeenCalled()

    navigateMockRouter("home", "list")
    expect(onLeave).toHaveBeenCalledTimes(1)

    navigateMockRouter("list", "home")
    expect(onEnter).toHaveBeenCalledTimes(2)
  })

  it("ignores transitions between pages of the group", () => {
    setMockCurrentRoute("list")
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, onLeave)

    navigateMockRouter("detail", "list")
    navigateMockRouter("list", "detail")

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onLeave).not.toHaveBeenCalled()
  })

  it("accepts arrays of callbacks", () => {
    setMockCurrentRoute("home")
    const firstEnter = vi.fn()
    const secondEnter = vi.fn()
    const firstLeave = vi.fn()
    const secondLeave = vi.fn()

    useOnPageEnterAndLeave(
      PAGES,
      [firstEnter, secondEnter],
      [firstLeave, secondLeave],
    )

    navigateMockRouter("list", "home")
    expect(firstEnter).toHaveBeenCalledTimes(1)
    expect(secondEnter).toHaveBeenCalledTimes(1)

    navigateMockRouter("home", "list")
    expect(firstLeave).toHaveBeenCalledTimes(1)
    expect(secondLeave).toHaveBeenCalledTimes(1)
  })

  it("treats nameless routes as outside the group", () => {
    setMockCurrentRoute(undefined)
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    useOnPageEnterAndLeave(PAGES, onEnter, onLeave)

    expect(onEnter).not.toHaveBeenCalled()

    navigateMockRouter("list", undefined)
    expect(onEnter).toHaveBeenCalledTimes(1)

    navigateMockRouter(undefined, "list")
    expect(onLeave).toHaveBeenCalledTimes(1)
  })
})
