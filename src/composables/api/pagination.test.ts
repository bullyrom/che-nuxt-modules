/* eslint-disable no-magic-numbers, unicorn/no-null */
import { describe, expect, it } from "vitest"

import { normalizePaginationResponse } from "./pagination"

function queryOf(url: string | undefined): Record<string, string> {
  expect(url).toBeDefined()
  const parsed = new URL(url as string, "https://example.test")
  return Object.fromEntries(parsed.searchParams.entries())
}

describe("normalizePaginationResponse", () => {
  it("normalizes the DRF envelope", () => {
    const normalized = normalizePaginationResponse(
      {
        count: 5,
        next: "https://api.example.test/items/?page=2",
        previous: null,
        results: [{ id: 1 }, { id: 2 }],
      },
      {
        requestedPage: 1,
        requestUrl: "https://api.example.test/items/?page=1",
      },
    )

    expect(normalized?.format).toBe("drf")
    expect(normalized?.items).toEqual([{ id: 1 }, { id: 2 }])
    expect(normalized?.count).toBe(5)
    expect(normalized?.next).toBe("https://api.example.test/items/?page=2")
    expect(normalized?.previous).toBeUndefined()
    expect(normalized?.page).toBe(1)
    expect(normalized?.pageSize).toBe(2)
  })

  it("normalizes the zero-based Rust page envelope and builds links", () => {
    const normalized = normalizePaginationResponse(
      {
        current_page: 0,
        data: [{ id: 1 }, { id: 2 }],
        page_size: 2,
        total_pages: 3,
      },
      { requestUrl: "https://api.example.test/items/?search=a" },
    )

    expect(normalized?.format).toBe("page")
    expect(normalized?.items).toEqual([{ id: 1 }, { id: 2 }])
    expect(normalized?.count).toBe(6)
    expect(normalized?.page).toBe(0)
    expect(normalized?.pageSize).toBe(2)
    expect(normalized?.totalPages).toBe(3)
    expect(queryOf(normalized?.next)).toEqual({ page: "1", search: "a" })
    expect(normalized?.previous).toBeUndefined()
  })

  it("stops at the last zero-based page and links back", () => {
    const normalized = normalizePaginationResponse(
      {
        current_page: 2,
        data: [{ id: 5 }],
        page_size: 2,
        total_pages: 3,
      },
      { requestUrl: "https://api.example.test/items/" },
    )

    expect(normalized?.next).toBeUndefined()
    expect(queryOf(normalized?.previous)).toEqual({ page: "1" })
  })

  it("normalizes offset/limit responses", () => {
    const normalized = normalizePaginationResponse(
      {
        data: [{ id: 3 }, { id: 4 }],
        limit: 2,
        offset: 2,
        total: 5,
      },
      { requestUrl: "https://api.example.test/items/" },
    )

    expect(normalized?.format).toBe("offset")
    expect(normalized?.count).toBe(5)
    expect(normalized?.page).toBe(1)
    expect(normalized?.pageSize).toBe(2)
    expect(queryOf(normalized?.next)).toEqual({ limit: "2", offset: "4" })
    expect(queryOf(normalized?.previous)).toEqual({
      limit: "2",
      offset: "0",
    })
  })

  it("detects offset/limit even when the items key is results", () => {
    const normalized = normalizePaginationResponse(
      {
        limit: 2,
        offset: 0,
        results: [{ id: 1 }, { id: 2 }],
        total: 5,
      },
      { requestUrl: "https://api.example.test/items/" },
    )

    expect(normalized?.format).toBe("offset")
    expect(queryOf(normalized?.next)).toEqual({ limit: "2", offset: "2" })
  })

  it("keeps page detection when the backend also sends null next links", () => {
    const normalized = normalizePaginationResponse(
      {
        current_page: 0,
        data: [{ id: 1 }],
        next: null,
        page_size: 10,
        previous: null,
        total_pages: 1,
      },
      { requestUrl: "https://api.example.test/items/" },
    )

    expect(normalized?.format).toBe("page")
    expect(normalized?.next).toBeUndefined()
  })
})
