import { computed, ref, toValue } from "vue"

import {
  buildQueryValues,
  hasQueryParameter,
} from "../../stores/adminPanel/queryParameters"

import type { ListQueryParameters } from "../../stores/adminPanel/queryParameters"
import type { MaybeRefOrGetter } from "vue"

interface UseListQueryParametersParameters {
  listQueryParameters: MaybeRefOrGetter<ListQueryParameters>
}

/**
 * Reactive state for the list endpoint query parameters (filters and sorting),
 * merging the generic schema-driven values with the fallback `search` input.
 * The schema parameters are supplied per instance so a standalone list works
 * without the global admin navigation.
 */
function useListQueryParameters(parameters: UseListQueryParametersParameters) {
  const searchQuery = ref("")
  const queryValues = ref<Record<string, unknown>>({})

  const listQueryParameters = computed(() =>
    toValue(parameters.listQueryParameters),
  )

  const usesSchemaSearch = computed(() =>
    hasQueryParameter(listQueryParameters.value, "search"),
  )

  const requestQuery = computed<Record<string, unknown> | undefined>(() => {
    const schemaQuery = buildQueryValues(queryValues.value)
    const fallbackSearch =
      !usesSchemaSearch.value && searchQuery.value
        ? { search: searchQuery.value }
        : {}
    const merged = { ...schemaQuery, ...fallbackSearch }
    return Object.keys(merged).length > 0 ? merged : undefined
  })

  function reset() {
    searchQuery.value = ""
    queryValues.value = {}
  }

  return {
    listQueryParameters,
    queryValues,
    requestQuery,
    reset,
    searchQuery,
    usesSchemaSearch,
  }
}

export { useListQueryParameters }
export type { UseListQueryParametersParameters }
