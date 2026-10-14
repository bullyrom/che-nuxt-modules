// eslint-disable-next-line import/no-extraneous-dependencies
import { renderToString } from "@vue/server-renderer"
import { describe, expect, it } from "vitest"
import { createSSRApp, h } from "vue"

import RecordEntry from "./RecordEntry.vue"

function render(value: unknown) {
  return renderToString(
    createSSRApp({
      render: () => h(RecordEntry, { fieldKey: "items", value }),
    }),
  )
}

describe("RecordEntry SSR", () => {
  it("labels non-empty collections in English", async () => {
    expect(await render([1, 2, 3])).toContain("3 items")
    expect(await render({ id: 5, name: "x" })).toContain("2 fields · id 5")
  })

  it("does not render a RollDown for empty collections", async () => {
    const emptyObject = await render({})
    const emptyArray = await render([])

    expect(emptyObject).not.toContain("<button")
    expect(emptyArray).not.toContain("<button")
    expect(emptyObject).toContain("{}")
    expect(emptyArray).toContain("[]")
  })
})
