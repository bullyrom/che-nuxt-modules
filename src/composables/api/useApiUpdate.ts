import { useKeyedMutation } from "./keyedMutation"
import { UPDATE_REQUEST_FAILED_MESSAGE } from "./messages"

type UseFirstCheApiUpdateParameters = Parameters<typeof useApiUpdate>[0]
type UseCheApiUpdateBaseParameters<
  FetchUrl extends string = string,
  Method = "patch" | "post" | "put",
> = Omit<UseFirstCheApiUpdateParameters, "url"> & {
  method: Method
  url: FetchUrl
}

interface UseUpdateParameters {
  method?: "patch" | "post" | "put"
  url: string
}

/**
 * Per-id patch/put helper: exposes keyed-by-id `updateStatus(id)`,
 * `updateErrors(id)`, `updateRequestErrors(id)` and `reset(id)`.
 */
export function useApiUpdate<
  UpdateData extends Record<string, unknown> | unknown = Record<
    string,
    unknown
  >,
  Response extends Record<string, unknown> | unknown = Record<string, unknown>,
>(parameters: UseUpdateParameters) {
  const { errors, request, requestErrors, reset, status } = useKeyedMutation({
    errorMessage: UPDATE_REQUEST_FAILED_MESSAGE,
    method: parameters.method,
    url: parameters.url,
  })

  function update(fetchParameters: {
    data: Partial<UpdateData>
    id: string
    onResponse?: (response: Response) => void
    /** Base URL override (must end with `/`); defaults to the composable URL. */
    url?: string
  }): Promise<Response | undefined> {
    if (!fetchParameters?.data) {
      console.error("Update data is required")
      return Promise.resolve(undefined)
    }

    return request<Response>({
      body: fetchParameters.data,
      id: fetchParameters.id,
      method: parameters.method ?? "patch",
      onResponse: fetchParameters.onResponse,
      url: fetchParameters.url,
    })
  }

  return {
    reset,
    update,
    updateErrors: errors,
    updateRequestErrors: requestErrors,
    updateStatus: status,
  }
}

export type { UseCheApiUpdateBaseParameters }
