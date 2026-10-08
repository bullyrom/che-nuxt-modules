import { computed, ref } from "vue"

import { useAdminPanelStore } from "../../stores/adminPanel/index"
import {
  buildQueryValues,
  hasQueryParameter,
} from "../../stores/adminPanel/queryParameters"

/**
 * Reactive state for the list endpoint query parameters (filters and sorting),
 * merging the generic schema-driven values with the fallback `search` input.
 */
function useListQueryParameters() {
  const adminPanelStore = useAdminPanelStore()

  const searchQuery = ref("")
  const queryValues = ref<Record<string, unknown>>({})

  const listQueryParameters = computed(
    () => adminPanelStore.activeEntityListQueryParameters,
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
