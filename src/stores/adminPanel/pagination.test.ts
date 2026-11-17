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
