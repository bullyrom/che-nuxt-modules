import { computed, onMounted, useId } from "vue"

import { toSelectOptions } from "../components/select"
import { useSelectOptionsStore } from "../stores/selectOptions"

import type { SelectOption } from "../components/select"

interface UseRemoteSelectOptionsParameters<
  OptionType extends Record<string, unknown>,
> {
  /** Options always shown first (e.g. the currently selected record). */
  extraOptions?: SelectOption[]
  /** Stable key; generated per component when omitted. */
  instanceKey?: string
  labelKey: keyof OptionType
  query?: Record<string, unknown>
  searchParameter?: string
  url: string
  valueKey: keyof OptionType
}

/**
 * Loads select options from a paginated/plain list endpoint and maps them to
 * `{ label, value }`. Shared by `RemoteSelect`/`RemoteMultiSelect`; a stable
 * per-component instance key is generated when the host does not pass one.
 */
function useRemoteSelectOptions<OptionType extends Record<string, unknown>>(
  parameters: UseRemoteSelectOptionsParameters<OptionType>,
) {
  const generatedInstanceKey = useId()

  const store = useSelectOptionsStore({
    instanceKey: parameters.instanceKey ?? generatedInstanceKey,
    query: parameters.query,
    searchParameter: parameters.searchParameter,
    url: parameters.url,
  })

  const options = computed<SelectOption[]>(() => [
    ...(parameters.extraOptions ?? []),
    ...toSelectOptions(
      store.options,
      parameters.labelKey,
      parameters.valueKey,
    ),
  ])

  onMounted(() => {
    store.load()
  })

  return { options, store }
}

export { useRemoteSelectOptions }
export type { UseRemoteSelectOptionsParameters }
