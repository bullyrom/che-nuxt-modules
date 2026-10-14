import debounce from "lodash-es/debounce"
import { ref, watch } from "vue"

import { usePaginatedListApi } from "../composables/api"

import { createInstanceRegistry } from "./instanceRegistry"

const DEFAULT_SEARCH_PARAMETER = "search"
const SEARCH_DEBOUNCE_MS = 300

interface UseSelectOptionsParameters {
  /** Dictionary key: one options store per key and per active Pinia. */
  instanceKey: string
  /** Extra static query parameters merged into every request. */
  query?: Record<string, unknown>
  /** Query parameter name driven by the search box (default `search`). */
  searchParameter?: string
  /** List endpoint URL; may return a flat array or a paginated envelope. */
  url: string
}

/**
 * Options source for a remote select, built on `usePaginatedListApi` (which
 * handles both a flat array and the Django `{ count, next, results }` envelope).
 * Keyed so two selects never share state; the component calls `load` on open.
 */
function createSelectOptions(parameters: UseSelectOptionsParameters) {
  const list = usePaginatedListApi<Record<string, unknown>[]>({
    query: parameters.query,
    url: parameters.url,
  })

  const searchQuery = ref("")
  const searchParameter =
    parameters.searchParameter ?? DEFAULT_SEARCH_PARAMETER

  async function load() {
    const query =
      searchQuery.value === ""
        ? undefined
        : { [searchParameter]: searchQuery.value }
    await list.fetchData({ query })
  }

  const loadDebounced = debounce(() => {
    load()
  }, SEARCH_DEBOUNCE_MS)
  watch(searchQuery, loadDebounced)

  return {
    load,
    loadNextPage: list.fetchNextPage,
    options: list.data,
    searchQuery,
    showLoader: list.showNextPageLoader,
    status: list.fetchDataStatus,
  }
}

type SelectOptionsStore = ReturnType<typeof createSelectOptions>

const registry = createInstanceRegistry<
  UseSelectOptionsParameters,
  SelectOptionsStore
>({
  idPrefix: "select-options",
  setup: createSelectOptions,
})

/** Returns (creating on first use) the options store for the instance key. */
function useSelectOptionsStore(
  parameters: UseSelectOptionsParameters,
): SelectOptionsStore {
  return registry.use(parameters)
}

/** Returns an already-created options store, or `undefined`. */
function getSelectOptionsStore(
  instanceKey: string | undefined,
): SelectOptionsStore | undefined {
  return registry.get(instanceKey)
}

export { getSelectOptionsStore, useSelectOptionsStore }
export type { SelectOptionsStore, UseSelectOptionsParameters }
