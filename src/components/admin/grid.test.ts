import { describe, expect, it } from "vitest"

import {
  buildListGridClass,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_LIST_GRID_CLASS,
  GRID_COLUMNS_CLASS,
} from "./grid"

const MAX_GRID_COLUMNS = Object.keys(GRID_COLUMNS_CLASS).length
const UNSUPPORTED_COLUMNS = MAX_GRID_COLUMNS + 2

describe("buildListGridClass", () => {
  it("defaults to three objects per row on desktop and one on mobile", () => {
    expect(DEFAULT_GRID_COLUMNS).toBe(3)
    expect(buildListGridClass(undefined)).toBe(DEFAULT_LIST_GRID_CLASS)
    expect(DEFAULT_LIST_GRID_CLASS).toContain("grid-cols-1")
    expect(DEFAULT_LIST_GRID_CLASS).toContain("md:grid-cols-3")
  })

  it("keeps one object per row when explicitly configured", () => {
    expect(buildListGridClass(1)).toBe("grid gap-4 grid-cols-1")
  })

  it("uses the configured count from the md breakpoint upwards", () => {
    expect(buildListGridClass(2)).toBe("grid gap-4 grid-cols-1 md:grid-cols-2")
    expect(buildListGridClass(MAX_GRID_COLUMNS)).toBe(
      "grid gap-4 grid-cols-1 md:grid-cols-6",
    )
  })

  it("falls back to the default for unsupported values", () => {
    expect(buildListGridClass(0)).toBe(DEFAULT_LIST_GRID_CLASS)
    expect(buildListGridClass(UNSUPPORTED_COLUMNS)).toBe(
      DEFAULT_LIST_GRID_CLASS,
    )
  })
})
