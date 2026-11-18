/* eslint-disable unicorn/no-null */
import { ofetch } from "ofetch"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePaginatedListApi } from "./usePaginatedListApi"

vi.mock("ofetch", () => ({ ofetch: vi.fn() }))

type FetchOptions = NonNullable<Parameters<typeof ofetch>[1]>
type ResponseContext = Parameters<NonNullable<FetchOptions["onResponse"]>>[0]
type Items = { id: number }[]

const fetchMock = vi.mocked(ofetch)

function mockBodies(bodies: Record<string, unknown>) {
  fetchMock.mockImplementation(((url: string, options?: FetchOptions) => {
    const body = bodies[url]
    const context = { response: { _data: body, status: 200 } }
    options?.onResponse?.(context as ResponseContext)
    return Promise.resolve(body)
  }) as typeof ofetch)
}

describe("usePaginatedListApi DRF envelope", () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it("loads and appends DRF pages through next links", async () => {
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
    const list = usePaginatedListApi<Items>({ url: "" })

    await list.fetchData({ url: firstUrl })
    await list.fetchNextPage()

    expect(list.data.value).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(list.count.value).toBe(3)
    expect(list.nextPageUrl.value).toBeNull()
  })

  it("does not parse a non-DRF page envelope", async () => {
    const response = {
      current_page: 0,
      data: [{ id: 1 }],
      page_size: 1,
      total_pages: 1,
    }
    mockBodies({ "https://api.example.test/items/": response })
    const list = usePaginatedListApi<Items>({ url: "" })

    await list.fetchData({ url: "https://api.example.test/items/" })

    expect(list.data.value).toBeUndefined()
    expect(list.rawData.value).toEqual(response)
  })

  it("does not parse a plain array response", async () => {
    const response = [{ id: 1 }]
    mockBodies({ "https://api.example.test/items/": response })
    const list = usePaginatedListApi<Items>({ url: "" })

    await list.fetchData({ url: "https://api.example.test/items/" })

    expect(list.data.value).toBeUndefined()
    expect(list.rawData.value).toEqual(response)
  })
})
