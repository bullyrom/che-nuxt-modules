// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest"
import { defineComponent, h, ref } from "vue"

import {
  AudioField,
  AudioValue,
  DateField,
  DateTimeField,
  FileField,
  ImageField,
  ImageValue,
  VideoField,
  VideoValue,
} from "../../src/index"

import { flush, mountComponent, typeInto } from "./helpers/mount"

import type { FieldDescriptor } from "../../src/index"

const FIELD: FieldDescriptor = { key: "value", kind: "string" }

// eslint-disable-next-line init-declarations
let unmountCurrent: (() => void) | undefined

afterEach(() => {
  unmountCurrent?.()
  unmountCurrent = undefined
  document.body.innerHTML = ""
})

function text(container: HTMLElement): string {
  return container.textContent ?? ""
}

describe("media values and fields", () => {
  it("renders media values only when a source is present", async () => {
    const empty = await mountComponent(ImageValue, {})
    expect(empty.container.querySelector("a")).toBeNull()
    empty.unmount()

    const image = await mountComponent(ImageValue, {
      alt: "Cover",
      href: "/full",
      src: "https://cdn.test/cover.png",
    })
    unmountCurrent = image.unmount
    expect(image.container.querySelector("a")?.getAttribute("href")).toBe(
      "/full",
    )
    expect(image.container.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn.test/cover.png",
    )

    image.unmount()
    const audio = await mountComponent(AudioValue, {
      src: "https://cdn.test/sound.mp3",
    })
    expect(
      audio.container.querySelector("audio")?.hasAttribute("controls"),
    ).toBe(true)
    audio.unmount()

    const video = await mountComponent(VideoValue, {
      src: "https://cdn.test/movie.mp4",
    })
    expect(
      video.container.querySelector("video")?.hasAttribute("controls"),
    ).toBe(true)
    video.unmount()
  })

  it("shows the current image and a single-file image input", async () => {
    const result = await mountComponent(ImageField, {
      field: FIELD,
      modelValue: "https://cdn.test/current.png",
    })
    unmountCurrent = result.unmount

    expect(result.container.querySelector("img")).not.toBeNull()
    const input = result.container.querySelector('input[type="file"]')
    expect(input?.getAttribute("accept")).toBe("image/*")
    expect(input?.hasAttribute("multiple")).toBe(false)
  })

  it("emits the selected file from a single-file FileField", async () => {
    const value = ref<unknown>()
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(FileField, {
            field: FIELD,
            modelValue: value.value,
            multiple: false,
            "onUpdate:modelValue": (next: unknown) => {
              value.value = next
            },
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    const input = result.container.querySelector('input[type="file"]')
    const file = new File(["content"], "photo.png", { type: "image/png" })
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    })
    input?.dispatchEvent(new Event("change", { bubbles: true }))
    await flush()

    expect(value.value).toBeInstanceOf(File)
    expect((value.value as File).name).toBe("photo.png")
    expect(text(result.container)).toContain("photo.png")
  })

  it("uses the media accept defaults on the media fields", async () => {
    const audio = await mountComponent(AudioField, { field: FIELD })
    expect(
      audio.container
        .querySelector('input[type="file"]')
        ?.getAttribute("accept"),
    ).toBe("audio/*")
    audio.unmount()

    const video = await mountComponent(VideoField, {
      accept: "video/webm",
      field: FIELD,
    })
    expect(
      video.container
        .querySelector('input[type="file"]')
        ?.getAttribute("accept"),
    ).toBe("video/webm")
    video.unmount()
  })
})

describe("date fields", () => {
  it("renders an ISO date as a date input and writes back an ISO string", async () => {
    const value = ref<string | undefined>("2024-03-05")
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(DateField, {
            field: FIELD,
            modelValue: value.value,
            "onUpdate:modelValue": (next: string | undefined) => {
              value.value = next
            },
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    const input = result.container.querySelector('input[type="date"]')
    expect((input as HTMLInputElement).value).toBe("2024-03-05")

    await typeInto(input, "2024-06-01")
    expect(value.value).toBe(new Date("2024-06-01").toISOString())
  })

  it("round-trips a datetime-local value through ISO", async () => {
    const iso = "2024-03-05T08:30:00.000Z"
    const value = ref<string | undefined>(iso)
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(DateTimeField, {
            field: FIELD,
            modelValue: value.value,
            "onUpdate:modelValue": (next: string | undefined) => {
              value.value = next
            },
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    const input = result.container.querySelector(
      'input[type="datetime-local"]',
    ) as HTMLInputElement
    expect(input.value).not.toBe("")

    await typeInto(input, "2024-06-01T12:15")
    expect(value.value).toBe(new Date("2024-06-01T12:15").toISOString())
  })
})
