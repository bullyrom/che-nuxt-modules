import { isArray, isPlainObject, isString } from "lodash-es"
import { computed, ref } from "vue"

import { useListApi } from "./useListApi"

const FIRST_PAGE = 1

type UseFirstPaginatedCheListApiParameters = Parameters<typeof useListApi>[0]
type UseChePaginatedListApiBaseParameters<
  FetchUrl extends string = string,
  Query extends object | unknown = unknown,
  ValideQuery extends object = Query extends object ? Query : object,
> = Omit<UseFirstPaginatedCheListApiParameters, "url"> & {
  query?: ValideQuery
  url: FetchUrl
}

interface PaginatedResponse<ResponseData> {
  count: number
  next: null | string
  previous: null | string
  results: ResponseData
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
>(parameters: { query?: Query; url: string }) {
  const {
    data: paginatedData,
    fetchData: fetchDataBase,
    fetchDataErrors,
    fetchDataStatus,
    reset: resetBase,
  } = useListApi<PaginatedResponse<ResponseData>, Query>(parameters)

  const data = ref<ResponseData>()
  const count = ref<number>()
  const nextPageUrl = ref<null | string>()
  const previousPageUrl = ref<null | string>()
  const page = ref<number>()
  const requestUrl = ref<string>()
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
    page.value = resolvePageNumber(requestUrl.value, FIRST_PAGE)
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
      await fetchDataBase({
        query: pageQuery.value,
        url: nextPageUrl.value,
      })
      // The page number is derived from the request that has just completed.
      // eslint-disable-next-line require-atomic-updates
      page.value = resolvePageNumber(requestUrl.value, fallbackPage)
      setDataFromResponse(true)
    }
  }

  function setDataFromResponse(add = false) {
    if (
      fetchDataStatus.value !== "success" ||
      paginatedData.value === undefined
    )
      return

    // The library supports the Django DRF envelope only. Any other shape
    // stays in `rawData` so the caller can render or handle it explicitly.
    if (!isPlainObject(paginatedData.value)) return

    const {
      count: responseCount,
      next,
      previous,
      results,
    } = paginatedData.value as PaginatedResponse<ResponseData>

    if (!isArray(results) || typeof responseCount !== "number") return

    if (add) {
      if (isArray(data.value)) data.value.push(...results)
      else console.error(`Response from ${parameters.url} url is not Array`)
    } else {
      data.value = results
    }
    count.value = responseCount
    nextPageUrl.value = resolveSameOriginPageUrl(next, requestUrl.value)
    previousPageUrl.value = resolveSameOriginPageUrl(
      previous,
      requestUrl.value,
    )
  }

  function reset() {
    pageQuery.value = undefined
    page.value = undefined
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
    previousPageUrl,
    rawData: paginatedData,
    reset,
    showFooter,
    showNextPageLoader,
  }
}

export type { UseChePaginatedListApiBaseParameters }
