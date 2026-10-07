import { FetchError, ofetch } from "ofetch"
import { reactive } from "vue"

import type { FormErrors, RequestStatus } from "@/types"

const HTTP_STATUS_BAD_REQUEST = 400

/** Request method supported by the keyed mutation helpers. */
type KeyedMutationMethod = "patch" | "post" | "put"

/** Per-record request state kept inside a keyed mutation. */
interface KeyedMutationState {
  errors?: FormErrors
  id: string
  requestErrors?: string
  status: RequestStatus
}

interface KeyedMutationParameters {
  /** Message stored when the request fails for a non-400 reason. */
  errorMessage: string
  method?: KeyedMutationMethod
  url: string
}

/**
 * Shared implementation for the per-id update/delete composables. It keeps one
 * state entry per record id (so several rows can be mutated on one screen),
 * builds `${url}${id}/`, stores a Django 400 body as `errors` and any other
 * failure as `requestErrors`, and drops the entry on success.
 */
function useKeyedMutation(parameters: KeyedMutationParameters) {
  const states = reactive<KeyedMutationState[]>([])

  function getOrCreateState(id: string): KeyedMutationState {
    let state = states.find((candidate) => candidate.id === id)
    if (!state) {
      state = {
        errors: undefined,
        id,
        requestErrors: undefined,
        status: "idle",
      }
      states.push(state)
    }
    return state
  }

  function removeState(id: string) {
    const index = states.findIndex((state) => state.id === id)
    if (index !== -1) states.splice(index, 1)
  }

  async function request<Response>(fetchParameters: {
    body?: unknown
    id: string
    method?: "delete" | KeyedMutationMethod
    onResponse?: (response: Response) => void
    /** Base URL override (must end with `/`); defaults to the composable URL. */
    url?: string
  }): Promise<Response | undefined> {
    const state = getOrCreateState(fetchParameters.id)

    try {
      state.status = "pending"
      state.requestErrors = undefined
      state.errors = undefined

      const baseUrl = fetchParameters.url ?? parameters.url
      const url = `${baseUrl}${fetchParameters.id}/`
      const response = await ofetch<Response>(url, {
        body: fetchParameters.body,
        method: (fetchParameters.method ?? parameters.method ?? "patch") as
          | "DELETE"
          | "PATCH"
          | "POST"
          | "PUT",
      })
      state.status = "success"
      removeState(fetchParameters.id)

      fetchParameters.onResponse?.(response)

      return response
    } catch (error) {
      if (error instanceof FetchError) {
        if (error.status === HTTP_STATUS_BAD_REQUEST) {
          state.errors = error.data as FormErrors
        }
        state.requestErrors = parameters.errorMessage
        state.status = "error"
      }
      return undefined
    }
  }

  function reset(id: string) {
    const state = getOrCreateState(id)
    state.status = "idle"
    state.requestErrors = undefined
    state.errors = undefined
  }

  function status(id: string) {
    return getOrCreateState(id).status
  }

  function requestErrors(id: string) {
    return getOrCreateState(id).requestErrors
  }

  function errors(id: string) {
    return getOrCreateState(id).errors
  }

  return { errors, request, requestErrors, reset, status }
}

export { useKeyedMutation }
export type { KeyedMutationMethod, KeyedMutationState }
