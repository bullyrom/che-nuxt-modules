/* eslint-disable no-magic-numbers, unicorn/no-null */
import { ofetch } from "ofetch"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePaginatedListApi } from "./usePaginatedListApi"

vi.mock("ofetch", () => ({ ofetch: vi.fn() }))

type FetchOptions = NonNullable<Parameters<typeof ofetch>[1]>
type ResponseContext = Parameters<NonNullable<FetchOptions["onResponse"]>>[0]

const fetchMock = vi.mocked(ofetch)

function mockBodies(bodies: Record<string, unknown>) {
  fetchMock.mockImplementation(((url: string, options?: FetchOptions) => {
    const body = bodies[url]
    const context = { response: { _data: body, status: 200 } }
    options?.onResponse?.(context as ResponseContext)
    return Promise.resolve(body)
  }) as typeof ofetch)
}

describe("usePaginatedListApi formats", () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it("appends zero-based page responses", async () => {
    const firstUrl = "https://api.example.test/items/"
    const secondUrl = `${firstUrl}?page=1`
    mockBodies({
      [firstUrl]: {
        current_page: 0,
        data: [{ id: 1 }, { id: 2 }],
        page_size: 2,
        total_pages: 2,
      },
      [secondUrl]: {
        current_page: 1,
        data: [{ id: 3 }, { id: 4 }],
        page_size: 2,
        total_pages: 2,
      },
    })
    const list = usePaginatedListApi<{ id: number }[]>({ url: "" })

    await list.fetchData({ url: firstUrl })

    expect(list.data.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(list.count.value).toBe(4)
    expect(list.page.value).toBe(0)
    expect(list.pageSize.value).toBe(2)
    expect(list.totalPages.value).toBe(2)
    expect(list.paginationFormat.value).toBe("page")
    expect(list.nextPageUrl.value).toBe(secondUrl)

    await list.fetchNextPage()

    expect(list.data.value).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ])
    expect(list.page.value).toBe(1)
    expect(list.nextPageUrl.value).toBeNull()
  })

  it("appends DRF responses through explicit next links", async () => {
    const firstUrl = "https://api.example.test/items/?page=1"
    const secondUrl = "https://api.example.test/items/?page=2"
    mockBodies({
      [firstUrl]: {
        count: 3,
        next: secondUrl,
        previous: null,
        results: [{ id: 1 }, { id: 2 }],
      },
      [secondUrl]: {
        count: 3,
        next: null,
        previous: firstUrl,
        results: [{ id: 3 }],
      },
    })
    const list = usePaginatedListApi<{ id: number }[]>({ url: "" })

    await list.fetchData({ url: firstUrl })
    await list.fetchNextPage()

    expect(list.data.value).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(list.count.value).toBe(3)
    expect(list.page.value).toBe(2)
    expect(list.paginationFormat.value).toBe("drf")
    expect(list.nextPageUrl.value).toBeNull()
  })
})
