import { describe, expect, it } from "vitest"

import { isPaginatedListSchema } from "./pagination"

describe("isPaginatedListSchema", () => {
  it("accepts the Django pagination envelope", () => {
    expect(
      isPaginatedListSchema({
        properties: {
          count: { type: "integer" },
          next: { type: "string" },
          previous: { type: "string" },
          results: { items: {}, type: "array" },
        },
        type: "object",
      }),
    ).toBe(true)
  })

  it("accepts zero-based page and offset/limit envelopes", () => {
    expect(
      isPaginatedListSchema({
        properties: {
          current_page: { type: "integer" },
          data: { items: {}, type: "array" },
          page_size: { type: "integer" },
          total_pages: { type: "integer" },
        },
        type: "object",
      }),
    ).toBe(true)
    expect(
      isPaginatedListSchema({
        properties: {
          data: { items: {}, type: "array" },
          limit: { type: "integer" },
          offset: { type: "integer" },
          total: { type: "integer" },
        },
        type: "object",
      }),
    ).toBe(true)
  })

  it("rejects a plain list and an empty schema", () => {
    expect(
      isPaginatedListSchema({ items: { type: "string" }, type: "array" }),
    ).toBe(false)
    expect(isPaginatedListSchema(undefined)).toBe(false)
    expect(
      isPaginatedListSchema({
        properties: { count: { type: "integer" } },
        type: "object",
      }),
    ).toBe(false)
  })
})
