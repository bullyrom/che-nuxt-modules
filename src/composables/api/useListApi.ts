import { ofetch } from "ofetch"
import { ref } from "vue"

import { FETCH_DATA_ERROR_MESSAGE } from "./messages"

import type { RequestStatus } from "@/types"

const HTTP_STATUS_OK = 200

type UseFirstCheListApiParameters = Parameters<typeof useListApi>[0]

type UseCheListApiBaseParameters<
  FetchUrl extends string = string,
  Query extends object | unknown = unknown,
  ValideQuery extends object = Query extends object ? Query : object,
> = Omit<UseFirstCheListApiParameters, "url"> & {
  query?: ValideQuery
  url: FetchUrl
}

function useListApi<ResponseData = unknown[], Query = unknown>(parameters: {
  query?: Query
  url: string
}) {
  const data = ref<ResponseData>()
  const fetchDataStatus = ref<RequestStatus>("idle")
  const fetchDataErrors = ref()
  const query = ref<Query | undefined>(parameters.query)

  async function fetchData(fetchParameters?: { query?: Query; url?: string }) {
    fetchDataStatus.value = "pending"
    data.value = undefined
    fetchDataErrors.value = undefined
    let commonQuery = {}
    if (query.value) commonQuery = { ...commonQuery, ...query.value }
    if (fetchParameters?.query)
      commonQuery = { ...commonQuery, ...fetchParameters.query }

    try {
      await ofetch(fetchParameters?.url || parameters.url, {
        onResponse({ response }) {
          if (response.status === HTTP_STATUS_OK) {
            // eslint-disable-next-line no-underscore-dangle
            data.value = response._data as ResponseData
            fetchDataStatus.value = "success"
          }
        },
        query: commonQuery,
      })
    } catch {
      fetchDataErrors.value = FETCH_DATA_ERROR_MESSAGE
      fetchDataStatus.value = "error"
      console.error(`Error fetch api detail for url: ${parameters.url}`)
    }
  }

  function reset() {
    data.value = undefined
    fetchDataStatus.value = "idle"
    fetchDataErrors.value = undefined
  }

  return { data, fetchData, fetchDataErrors, fetchDataStatus, reset }
}

export type { UseCheListApiBaseParameters }
export { useListApi }
