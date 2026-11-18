import { normalizeOffsetResponse } from "./paginationOffset"
import { normalizePageResponse } from "./paginationPage"
import {
  COUNT_KEYS,
  detectPaginationFormat,
  explicitLink,
  isRecord,
  ITEM_KEYS,
  linkOrFallback,
  NEXT_KEYS,
  PREVIOUS_KEYS,
  withOption,
} from "./paginationShared"
import { readNumber } from "./paginationUrl"

import type {
  NormalizedPagination,
  PaginationAdapterOptions,
  PaginationContext,
} from "./paginationTypes"

/** Normalizes DRF, zero-based page, offset/limit and plain-array envelopes. */
function normalizePaginationResponse<Item = unknown>(
  response: unknown,
  context: PaginationContext = {},
): NormalizedPagination<Item> | undefined {
  const options: PaginationAdapterOptions = context.options ?? {}

  if (Array.isArray(response)) {
    return {
      count: response.length,
      format: "array",
      items: response as Item[],
      next: undefined,
      page: context.requestedPage,
      pageSize: response.length,
      previous: undefined,
    }
  }
  if (!isRecord(response)) return undefined

  const itemKey =
    options.itemsKey ?? ITEM_KEYS.find((key) => Array.isArray(response[key]))
  if (itemKey === undefined || !Array.isArray(response[itemKey])) {
    return undefined
  }

  const items = response[itemKey] as Item[]
  const format = detectPaginationFormat(response, itemKey, options)

  if (format === "drf") {
    const count = readNumber(
      response,
      withOption(options.countKey, COUNT_KEYS),
    )
    return {
      count,
      format,
      items,
      next: linkOrFallback(
        explicitLink(response, options.nextKey, NEXT_KEYS, () => undefined),
        undefined,
      ),
      page:
        readNumber(response, withOption(options.pageKey, [])) ??
        context.requestedPage,
      pageSize:
        readNumber(response, withOption(options.pageSizeKey, [])) ??
        items.length,
      previous: linkOrFallback(
        explicitLink(
          response,
          options.previousKey,
          PREVIOUS_KEYS,
          () => undefined,
        ),
        undefined,
      ),
      totalPages: readNumber(response, withOption(options.totalPagesKey, [])),
    }
  }

  if (format === "page") {
    return normalizePageResponse(response, items, context)
  }
  if (format === "offset") {
    return normalizeOffsetResponse(response, items, context)
  }

  return {
    count: items.length,
    format: "array",
    items,
    next: undefined,
    page: context.requestedPage,
    pageSize: items.length,
    previous: undefined,
  }
}

export { normalizePaginationResponse }
export type {
  NormalizedPagination,
  PaginationAdapterOptions,
  PaginationContext,
  PaginationFormat,
  PaginationFormatOption,
} from "./paginationTypes"
