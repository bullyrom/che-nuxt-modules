import { ofetch } from "ofetch"
import { ref } from "vue"

import { FETCH_DATA_ERROR_MESSAGE } from "./messages"

import type { RequestStatus } from "@/types"

const HTTP_STATUS_OK = 200

type UseFirstCheDetailApiParametersMethod = "get" | "post"

type UseFirstCheDetailApiParameters = Parameters<typeof useDetailApi>[0]

type UseCheDetailApiBaseParameters<
  FetchUrl extends string,
  Method extends UseFirstCheDetailApiParametersMethod,
> = Omit<UseFirstCheDetailApiParameters, "method" | "url"> & {
  method?: Method
  url?: FetchUrl
}

function useDetailApi<ResponseData = unknown>(parameters?: {
  method?: UseFirstCheDetailApiParametersMethod
  url?: string
}) {
  const data = ref<ResponseData>()
  const fetchDataStatus = ref<RequestStatus>("idle")
  const fetchDataErrors = ref()

  async function fetchData(fetchParameters?: {
    id?: string
    onResponse?: (parameters: { responseData: ResponseData }) => void
    onResponseError?: () => void
    url?: string
  }) {
    fetchDataStatus.value = "pending"
    data.value = undefined
    fetchDataErrors.value = undefined

    // eslint-disable-next-line init-declarations
    let valideUrl: string | undefined
    if (fetchParameters?.url) {
      valideUrl = fetchParameters.url
    } else if (fetchParameters?.id && parameters?.url) {
      valideUrl = `${parameters.url}/${fetchParameters.id}/`
    }

    if (valideUrl === undefined) {
      console.error("URL for fetching API details not found")
      return
    }

    try {
      await ofetch(valideUrl, {
        method: parameters?.method || "get",
        onResponse({ response }) {
          if (response.status === HTTP_STATUS_OK) {
            // eslint-disable-next-line no-underscore-dangle
            data.value = response._data as ResponseData
            fetchDataStatus.value = "success"
            if (fetchParameters?.onResponse)
              // eslint-disable-next-line no-underscore-dangle
              fetchParameters.onResponse({ responseData: response._data })
          }
        },
      })
    } catch {
      fetchDataErrors.value = FETCH_DATA_ERROR_MESSAGE
      fetchDataStatus.value = "error"
      if (fetchParameters?.onResponseError) fetchParameters.onResponseError()
      console.error(`Error fetch api detail for url: ${valideUrl}`)
    }
  }

  function reset() {
    data.value = undefined
    fetchDataStatus.value = "idle"
    fetchDataErrors.value = undefined
  }

  return { data, fetchData, fetchDataErrors, fetchDataStatus, reset }
}

export type {
  UseCheDetailApiBaseParameters,
  UseFirstCheDetailApiParameters,
  UseFirstCheDetailApiParametersMethod,
}
export { useDetailApi }
