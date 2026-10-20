// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, ref } from "vue"

import {
  MultiSelect,
  RemoteMultiSelect,
  RemoteSelect,
  Select,
} from "../../src/index"

import { click, mountComponent, typeInto, waitFor } from "./helpers/mount"

import type { SelectOption } from "../../src/index"

const OPTIONS: SelectOption[] = [
  { label: "One", value: 1 },
  { label: "Two", value: 2 },
  { label: "Three", value: 3 },
]

// eslint-disable-next-line init-declarations
let unmountCurrent: (() => void) | undefined

afterEach(() => {
  unmountCurrent?.()
  unmountCurrent = undefined
  document.body.innerHTML = ""
  vi.unstubAllGlobals()
})

function text(container: HTMLElement): string {
  return container.textContent ?? ""
}

function findOption(container: HTMLElement, label: string) {
  return [...container.querySelectorAll("button")]
    .slice(1)
    .find((button) => button.textContent?.includes(label))
}

describe("presentational selects", () => {
  it("shows the placeholder, opens the panel and emits the chosen value", async () => {
    const value = ref<unknown>()
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(Select, {
            modelValue: value.value,
            "onUpdate:modelValue": (next: unknown) => {
              value.value = next
            },
            options: OPTIONS,
            placeholder: "Pick one",
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    expect(text(result.container)).toContain("Pick one")

    await click(result.container.querySelector("button"))
    expect(findOption(result.container, "Two")).toBeDefined()
    await click(findOption(result.container, "Two"))

    expect(value.value).toBe(2)
  })

  it("exposes the local search through v-model:search-query", async () => {
    const search = ref("")
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(Select, {
            "onUpdate:searchQuery": (next: string) => {
              search.value = next
            },
            options: OPTIONS,
            searchable: true,
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount

    await click(result.container.querySelector("button"))
    await typeInto(
      result.container.querySelector('input[placeholder="Search..."]'),
      "tw",
    )
    expect(search.value).toBe("tw")
  })

  it("toggles several values in a multi-select", async () => {
    const value = ref<unknown[]>([1])
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(MultiSelect, {
            modelValue: value.value,
            "onUpdate:modelValue": (next: unknown[]) => {
              value.value = next
            },
            options: OPTIONS,
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    expect(text(result.container)).toContain("One")

    await click(result.container.querySelector("button"))
    await click(findOption(result.container, "Two"))
    expect(value.value).toEqual([1, 2])

    await click(findOption(result.container, "One"))
    expect(value.value).toEqual([2])
  })
})

const ALL_OPTIONS = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
  { id: 3, name: "Gamma" },
]

function stubOptionsFetch(): string[] {
  const calls: string[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn((input: unknown) => {
      const url = new URL(String(input))
      calls.push(url.toString())
      const search = url.searchParams.get("search") ?? ""
      const records =
        search === ""
          ? ALL_OPTIONS
          : ALL_OPTIONS.filter((option) =>
              option.name.toLowerCase().includes(search.toLowerCase()),
            )
      return Promise.resolve(Response.json(records))
    }),
  )
  return calls
}

describe("remote selects", () => {
  it("loads a flat array and emits the selected value", async () => {
    const calls = stubOptionsFetch()
    const value = ref<unknown>(1)
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(RemoteSelect, {
            instanceKey: "remote-select",
            labelKey: "name",
            modelValue: value.value,
            "onUpdate:modelValue": (next: unknown) => {
              value.value = next
            },
            url: "https://api.test/options/",
            valueKey: "id",
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    await waitFor(() => text(result.container).includes("Alpha"))
    expect(calls[0]).toContain("https://api.test/options/")

    await click(result.container.querySelector("button"))
    await click(findOption(result.container, "Beta"))
    expect(value.value).toBe(2)
  })

  it("passes the search term to the options request", async () => {
    const calls = stubOptionsFetch()
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(RemoteSelect, {
            instanceKey: "remote-select-search",
            labelKey: "name",
            searchable: true,
            url: "https://api.test/options/",
            valueKey: "id",
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    await waitFor(() =>
      calls.some((call) => call.includes("https://api.test/options/")),
    )

    await click(result.container.querySelector("button"))
    await typeInto(
      result.container.querySelector('input[placeholder="Search..."]'),
      "Beta",
    )
    await waitFor(() => calls.some((call) => call.includes("search=Beta")))
    await waitFor(() => !text(result.container).includes("Gamma"))
    expect(text(result.container)).toContain("Beta")
  })

  it("loads the paginated envelope and supports multi selection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          Response.json({
            count: ALL_OPTIONS.length,
            next: undefined,
            previous: undefined,
            results: ALL_OPTIONS,
          }),
        ),
      ),
    )
    const value = ref<unknown[]>([])
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(RemoteMultiSelect, {
            instanceKey: "remote-multi",
            labelKey: "name",
            modelValue: value.value,
            "onUpdate:modelValue": (next: unknown[]) => {
              value.value = next
            },
            url: "https://api.test/options/",
            valueKey: "id",
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount

    await click(result.container.querySelector("button"))
    await waitFor(() => text(result.container).includes("Gamma"))
    await click(findOption(result.container, "Gamma"))
    expect(value.value).toEqual([3])
  })
})
