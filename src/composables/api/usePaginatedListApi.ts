import { isArray, isString } from "lodash-es"
import { computed, ref } from "vue"

import { normalizePaginationResponse } from "./pagination"
import { useListApi } from "./useListApi"

import type {
  PaginationAdapterOptions,
  PaginationFormat,
} from "./paginationTypes"

const FIRST_PAGE = 1

type UseFirstPaginatedCheListApiParameters = Parameters<typeof useListApi>[0]
type UseChePaginatedListApiBaseParameters<
  FetchUrl extends string = string,
  Query extends object | unknown = unknown,
  ValideQuery extends object = Query extends object ? Query : object,
> = Omit<UseFirstPaginatedCheListApiParameters, "url"> & {
  pagination?: PaginationAdapterOptions
  query?: ValideQuery
  url: FetchUrl
}

/**
 * Reads the page number from a pagination URL. Falls back to `fallback` when
 * the URL is missing or does not carry a valid `page` query parameter.
 */
function resolvePageNumber(
  pageUrl: null | string | undefined,
  fallback: number,
): number {
  if (!pageUrl) return fallback
  try {
    const url = new URL(pageUrl, "http://localhost")
    const value = Number(url.searchParams.get("page"))
    return Number.isInteger(value) && value >= FIRST_PAGE ? value : fallback
  } catch {
    return fallback
  }
}

/**
 * Rewrites a DRF `next`/`previous` URL to the same origin as the list request.
 * A backend behind a TLS-terminating proxy may build absolute `http://` URLs
 * (it never learns the original scheme), which the browser then blocks as mixed
 * content when the app runs over https.
 */
function resolveSameOriginPageUrl(
  pageUrl: null | string | undefined,
  requestUrl: string | undefined,
): null | string | undefined {
  if (!pageUrl || !requestUrl) return pageUrl

  try {
    const base = new URL(requestUrl)
    const target = new URL(pageUrl, base)
    target.protocol = base.protocol
    target.host = base.host
    return target.toString()
  } catch {
    return pageUrl
  }
}

export function usePaginatedListApi<
  ResponseData = unknown,
  Query = unknown,
>(parameters: {
  pagination?: PaginationAdapterOptions
  query?: Query
  url: string
}) {
  const {
    data: paginatedData,
    fetchData: fetchDataBase,
    fetchDataErrors,
    fetchDataStatus,
    reset: resetBase,
  } = useListApi<unknown, Query>(parameters)

  const data = ref<ResponseData>()
  const count = ref<number>()
  const nextPageUrl = ref<null | string>()
  const previousPageUrl = ref<null | string>()
  const page = ref<number>()
  const pageSize = ref<number>()
  const totalPages = ref<number>()
  const paginationFormat = ref<PaginationFormat>()
  const requestUrl = ref<string>()
  const requestedPage = ref<number>()
  // Query used for the current first page. DRF usually repeats it in `next`,
  // but a custom/relative pagination link may omit it; keep it so pagination
  // does not silently drop search or filters.
  const pageQuery = ref<Query>()

  const showNextPageLoader = computed(
    () => fetchDataStatus.value !== "success" || isString(nextPageUrl.value),
  )

  const showFooter = computed(
    () =>
      // Show footer when page first opening from ssr or wehen all pages loaded.
      fetchDataStatus.value === "idle" ||
      (fetchDataStatus.value === "success" && !nextPageUrl.value),
  )

  async function fetchData(
    fetchParameters: Parameters<typeof fetchDataBase>[0],
  ) {
    requestUrl.value = fetchParameters?.url ?? parameters.url
    pageQuery.value = fetchParameters?.query
    requestedPage.value = resolvePageNumber(requestUrl.value, FIRST_PAGE)
    count.value = undefined
    nextPageUrl.value = undefined
    previousPageUrl.value = undefined
    await fetchDataBase(fetchParameters)
    setDataFromResponse()
  }

  async function fetchNextPage() {
    if (nextPageUrl.value && fetchDataStatus.value !== "pending") {
      requestUrl.value = nextPageUrl.value
      const fallbackPage = (page.value ?? FIRST_PAGE) + 1
      requestedPage.value = resolvePageNumber(requestUrl.value, fallbackPage)
      await fetchDataBase({
        query: pageQuery.value,
        url: nextPageUrl.value,
      })
      setDataFromResponse(true)
    }
  }

  function setDataFromResponse(add = false) {
    if (
      fetchDataStatus.value !== "success" ||
      paginatedData.value === undefined
    )
      return

    const normalized = normalizePaginationResponse<unknown>(
      paginatedData.value,
      {
        options: parameters.pagination,
        requestedPage: requestedPage.value,
        requestUrl: requestUrl.value,
      },
    )
    // A non-list response stays in `rawData`; the admin renders it raw.
    if (normalized === undefined) return

    if (add) {
      if (isArray(data.value)) data.value.push(...normalized.items)
      else console.error(`Response from ${parameters.url} url is not Array`)
    } else {
      data.value = normalized.items as ResponseData
    }
    count.value = normalized.count
    page.value = normalized.page
    pageSize.value = normalized.pageSize
    totalPages.value = normalized.totalPages
    paginationFormat.value = normalized.format
    // Keep null for "no such page" to stay compatible with the DRF API.
    /* eslint-disable unicorn/no-null */
    nextPageUrl.value = resolveSameOriginPageUrl(
      normalized.next ?? null,
      requestUrl.value,
    )
    previousPageUrl.value = resolveSameOriginPageUrl(
      normalized.previous ?? null,
      requestUrl.value,
    )
    /* eslint-enable unicorn/no-null */
  }

  function reset() {
    pageQuery.value = undefined
    page.value = undefined
    pageSize.value = undefined
    totalPages.value = undefined
    paginationFormat.value = undefined
    requestedPage.value = undefined
    count.value = undefined
    nextPageUrl.value = undefined
    previousPageUrl.value = undefined
    data.value = undefined
    resetBase()
  }

  return {
    count,
    data,
    fetchData,
    fetchDataErrors,
    fetchDataStatus,
    fetchNextPage,
    nextPageUrl,
    page,
    pageSize,
    paginationFormat,
    previousPageUrl,
    rawData: paginatedData,
    reset,
    showFooter,
    showNextPageLoader,
    totalPages,
  }
}

export type {
  PaginationAdapterOptions,
  PaginationFormat,
} from "./paginationTypes"
export type { UseChePaginatedListApiBaseParameters }
