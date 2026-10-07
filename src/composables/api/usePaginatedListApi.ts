import { isArray, isString } from "lodash-es"
import { computed, ref } from "vue"

import { useListApi } from "./useListApi"

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
  const requestUrl = ref<string>()

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
    count.value = undefined
    nextPageUrl.value = undefined
    previousPageUrl.value = undefined
    await fetchDataBase(fetchParameters)
    setDataFromResponse()
  }

  async function fetchNextPage() {
    if (nextPageUrl.value && fetchDataStatus.value !== "pending") {
      requestUrl.value = nextPageUrl.value
      await fetchDataBase({ url: nextPageUrl.value })
      setDataFromResponse(true)
    }
  }

  function setDataFromResponse(add = false) {
    if (
      fetchDataStatus.value !== "success" ||
      paginatedData.value === undefined
    )
      return

    const response: unknown = paginatedData.value

    // Non-paginated endpoint: the response body is the results array itself.
    if (isArray(response)) {
      if (add && isArray(data.value)) data.value.push(...response)
      else data.value = response as ResponseData
      count.value = response.length
      nextPageUrl.value = undefined
      previousPageUrl.value = undefined
      return
    }

    const {
      count: responseCount,
      next,
      previous,
      results,
    } = response as PaginatedResponse<ResponseData>

    if (add) {
      if (isArray(data.value) && isArray(results)) data.value.push(...results)
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
    previousPageUrl,
    reset,
    showFooter,
    showNextPageLoader,
  }
}

export type { UseChePaginatedListApiBaseParameters }
