import { cloneDeep } from "lodash-es"
import { FetchError, ofetch } from "ofetch"
import { computed, ref } from "vue"

import { FETCH_DATA_ERROR_MESSAGE } from "./messages"

import type { RequestStatus } from "@/types"

const HTTP_STATUS_BAD_REQUEST = 400

// type UseFirstCheApiCreateParameters = Parameters<typeof useFormApi>[0]
type UseCheApiCreateBaseParameters<
  FrontendForm extends Record<string, unknown> | unknown,
  BackendForm extends Record<string, unknown> | unknown,
  FetchUrl extends string,
  Method = "patch" | "post" | "put",
> = (FrontendForm extends BackendForm
  ? {
      serializeForm?: (
        form: FrontendForm,
      ) => BackendForm | FormData | Promise<BackendForm | FormData>
    }
  : {
      serializeForm: (
        form: FrontendForm,
      ) => BackendForm | FormData | Promise<BackendForm | FormData>
    }) & {
  blankForm: FrontendForm
  method?: Method
  url: FetchUrl
}

type SerializeFormResult<BackendForm> =
  | BackendForm
  | FormData
  | Promise<BackendForm | FormData>
function useFormApi<
  FrontendForm extends Record<string, unknown> | unknown = unknown,
  BackendForm extends Record<string, unknown> | unknown = FrontendForm,
  Url extends string | unknown = unknown,
  Response = unknown,
>(
  parameters: (FrontendForm extends BackendForm
    ? {
        serializeForm?: (
          form: FrontendForm,
        ) => SerializeFormResult<BackendForm>
      }
    : {
        serializeForm: (form: FrontendForm) => SerializeFormResult<BackendForm>
      }) & {
    blankForm: FrontendForm
    method?: "patch" | "post" | "put"
    url: Url
  },
) {
  type FormKeys = keyof FrontendForm
  type FormErrors = Partial<
    Record<"non_field_errors" | FormKeys, string[] | undefined>
  >

  const form = ref<FrontendForm>(
    parameters.blankForm
      ? cloneDeep(parameters.blankForm)
      : ({} as FrontendForm),
  )
  const sendFormStatus = ref<RequestStatus>("idle")
  const sendFormRequestErrors = ref<string>()
  const formErrors = ref<FormErrors>()

  const showForm = computed(() => {
    if (sendFormStatus.value === "pending") return false
    if (sendFormStatus.value === "error" && formErrors.value === undefined)
      return false
    return true
  })

  function clearFormErrorsForKey(formErrorsKey: keyof FormErrors) {
    if (formErrors.value?.[formErrorsKey])
      formErrors.value[formErrorsKey] = undefined
  }

  /** Resolves the submit URL: explicit override, `url` + `id`, or `url`. */
  function resolveSubmitUrl(fetchParameters?: {
    id?: string
    url?: string
  }): string {
    if (fetchParameters?.url) return fetchParameters.url
    if (fetchParameters?.id) return `${parameters.url}/${fetchParameters.id}/`
    return parameters.url as string
  }

  async function sendForm(fetchParameters?: {
    form: FrontendForm
    id?: string
    method?: "patch" | "post" | "put"
    onResponse?: (response: Response) => void
    /** Explicit submit URL override (otherwise `url` + optional `id`). */
    url?: string
  }) {
    try {
      sendFormStatus.value = "pending"
      sendFormRequestErrors.value = undefined
      formErrors.value = undefined

      const url = resolveSubmitUrl(fetchParameters)

      const transform =
        (
          parameters as {
            serializeForm?: (
              formData: FrontendForm,
            ) => BackendForm | FormData | Promise<BackendForm | FormData>
          }
        ).serializeForm ??
        ((formData: FrontendForm) => formData as unknown as BackendForm)

      const body = await transform(fetchParameters?.form ?? form.value)
      if (!body) throw new Error("serializeForm returned empty body")
      const fetchForm = ofetch.create({
        body,
        method: fetchParameters?.method || parameters.method || "post",
      })

      const response = await fetchForm<Response>(url)
      sendFormStatus.value = "success"

      if (fetchParameters?.onResponse) {
        fetchParameters.onResponse(response)
      }

      return response
    } catch (error) {
      if (error instanceof FetchError) {
        if (error.statusCode === HTTP_STATUS_BAD_REQUEST) {
          formErrors.value = error.data as FormErrors
        }
        sendFormRequestErrors.value = FETCH_DATA_ERROR_MESSAGE
        sendFormStatus.value = "error"
      }
      return undefined
    }
  }

  function reset() {
    form.value = parameters.blankForm
      ? cloneDeep(parameters.blankForm)
      : ({} as FrontendForm)
    sendFormStatus.value = "idle"
    sendFormRequestErrors.value = undefined
    formErrors.value = undefined
  }

  return {
    clearFormErrorsForKey,
    form,
    formErrors,
    reset,
    sendForm,
    sendFormRequestErrors,
    sendFormStatus,
    showForm,
  }
}

export { useFormApi }
export type { UseCheApiCreateBaseParameters }
