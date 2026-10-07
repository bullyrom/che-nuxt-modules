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
    count.value = undefined
    nextPageUrl.value = undefined
    previousPageUrl.value = undefined
    await fetchDataBase(fetchParameters)
    setDataFromResponse()
  }

  async function fetchNextPage() {
    if (nextPageUrl.value && fetchDataStatus.value !== "pending") {
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
    nextPageUrl.value = next
    previousPageUrl.value = previous
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
