import { computed } from "vue"

import type { RequestStatus } from "@/types"
import type { Ref } from "vue"

/**
 * Merges any number of request statuses into a single "show loader" flag.
 * When `noLoaderOnIdle` is `true`, the `idle` status is ignored so the loader
 * is not shown before the first request starts.
 */
export function useShowLoader(
  statuses: Ref<RequestStatus>[],
  noLoaderOnIdle = false,
) {
  return computed(() =>
    statuses.some((status) =>
      noLoaderOnIdle
        ? status.value !== "idle" && status.value !== "success"
        : status.value !== "success",
    ),
  )
}
