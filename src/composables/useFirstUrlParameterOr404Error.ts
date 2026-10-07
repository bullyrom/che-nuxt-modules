import { isArray, isNull } from "lodash-es"
import { computed } from "vue"

import { createDefault404Error } from "@/utils/errors"

/**
 * Reads a route parameter and throws the default 404 error when it is
 * missing or an array; returns a ref with the resolved string value.
 */
export function useFirstUrlParameterOr404Error(name: string) {
  const route = useRoute()

  const validatingParameter = route.params[name]

  if (
    isArray(validatingParameter) ||
    isNull(validatingParameter) ||
    validatingParameter === undefined ||
    validatingParameter === "null" ||
    validatingParameter === "undefined"
  ) {
    throw createDefault404Error()
  }

  return computed(() => route.params[name] as string)
}
