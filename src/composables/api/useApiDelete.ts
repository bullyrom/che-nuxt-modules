import { useKeyedMutation } from "./keyedMutation"
import { DESTROY_REQUEST_FAILED_MESSAGE } from "./messages"

type UseFirstCheApiDeleteParameters = Parameters<typeof useApiDelete>[0]
type UseCheApiDeleteBaseParameters<FetchUrl extends string = string> = Omit<
  UseFirstCheApiDeleteParameters,
  "url"
> & {
  url: FetchUrl
}

interface UseDeleteParameters {
  url: string
}

/**
 * Per-id delete helper: exposes keyed-by-id `destroyStatus(id)`,
 * `destroyErrors(id)`, `destroyRequestErrors(id)` and `reset(id)`.
 */
export function useApiDelete<Response = unknown>(
  parameters: UseDeleteParameters,
) {
  const { errors, request, requestErrors, reset, status } = useKeyedMutation({
    errorMessage: DESTROY_REQUEST_FAILED_MESSAGE,
    url: parameters.url,
  })

  function destroy(fetchParameters: {
    id: string
    onResponse?: (response: Response) => void
    /** Base URL override (must end with `/`); defaults to the composable URL. */
    url?: string
  }): Promise<Response | undefined> {
    return request<Response>({
      id: fetchParameters.id,
      method: "delete",
      onResponse: fetchParameters.onResponse,
      url: fetchParameters.url,
    })
  }

  return {
    destroy,
    destroyErrors: errors,
    destroyRequestErrors: requestErrors,
    destroyStatus: status,
    reset,
  }
}

export type { UseCheApiDeleteBaseParameters }
