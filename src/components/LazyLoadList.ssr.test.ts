// eslint-disable-next-line import/no-extraneous-dependencies
import { renderToString } from "@vue/server-renderer"
import { describe, expect, it } from "vitest"
import { createSSRApp, h } from "vue"

import EntityRecordCard from "./admin/EntityRecordCard.vue"
import LazyLoadList from "./LazyLoadList.vue"

const ITEM_COUNT = 5

const ITEMS = Array.from({ length: ITEM_COUNT }, (item, itemIndex) => ({
  id: itemIndex + 1,
  name: `item-${itemIndex + 1}`,
}))

function renderList(slotComponent: boolean) {
  const app = createSSRApp({
    render: () =>
      h(
        LazyLoadList,
        {
          fetchVisibleItemNumber: 4,
          items: ITEMS,
          listClass: "grid",
          showLoader: false,
        },
        {
          default: slotComponent
            ? ({ index, item }: { index: number; item: unknown }) =>
                h(EntityRecordCard, { index, item })
            : ({ item }: { item: { id: number } }) => h("span", `#${item.id}`),
        },
      ),
  })
  return renderToString(app)
}

describe("LazyLoadList SSR", () => {
  it("renders a stable div root with a plain slot", async () => {
    const html = await renderList(false)
    expect(html.startsWith("<div")).toBe(true)
    // No per-item `v-if` comment anchors (`<!---->`) between the items.
    expect(html).not.toContain("</span><!----></div>")
  })

  it("renders a stable div root with the admin EntityRecordCard slot", async () => {
    const html = await renderList(true)
    expect(html.startsWith("<div")).toBe(true)
    expect(html).toContain("rounded-xl border")
  })
})
