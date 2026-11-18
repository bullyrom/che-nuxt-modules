import {
  COUNT_KEYS,
  explicitLink,
  LIMIT_KEYS,
  LIMIT_QUERY_CANDIDATES,
  linkOrFallback,
  NEXT_KEYS,
  OFFSET_KEYS,
  OFFSET_QUERY_CANDIDATES,
  PAGE_SIZE_KEYS,
  PREVIOUS_KEYS,
  TOTAL_PAGES_KEYS,
  withOption,
  ZERO,
} from "./paginationShared"
import {
  buildUrlWithQuery,
  findQueryParameter,
  readNumber,
} from "./paginationUrl"

import type {
  NormalizedPagination,
  PaginationContext,
} from "./paginationTypes"

/** Normalizes an `{ items, total, offset, limit }` style response. */
function normalizeOffsetResponse<Item>(
  response: Record<string, unknown>,
  items: Item[],
  context: PaginationContext,
): NormalizedPagination<Item> {
  const options = context.options ?? {}
  const count = readNumber(response, withOption(options.countKey, COUNT_KEYS))
  const offset =
    readNumber(response, withOption(options.offsetKey, OFFSET_KEYS)) ?? ZERO
  const limit =
    readNumber(response, withOption(options.limitKey, LIMIT_KEYS)) ??
    readNumber(response, withOption(options.pageSizeKey, PAGE_SIZE_KEYS)) ??
    items.length
  const totalPages = readNumber(
    response,
    withOption(options.totalPagesKey, TOTAL_PAGES_KEYS),
  )
  const page = limit > ZERO ? Math.floor(offset / limit) : ZERO

  const offsetParameter =
    options.offsetParam ??
    findQueryParameter(context.requestUrl, OFFSET_QUERY_CANDIDATES) ??
    "offset"
  const limitParameter =
    options.limitParam ??
    findQueryParameter(context.requestUrl, LIMIT_QUERY_CANDIDATES) ??
    "limit"
  function buildOffsetUrl(targetOffset: number): string | undefined {
    return buildUrlWithQuery(context.requestUrl, {
      [limitParameter]: limit > ZERO ? limit : undefined,
      [offsetParameter]: targetOffset,
    })
  }

  const nextLink = explicitLink(
    response,
    options.nextKey,
    NEXT_KEYS,
    buildOffsetUrl,
  )
  const previousLink = explicitLink(
    response,
    options.previousKey,
    PREVIOUS_KEYS,
    buildOffsetUrl,
  )
  const hasNext =
    limit > ZERO &&
    (count === undefined
      ? totalPages !== undefined && page + 1 < totalPages
      : offset + limit < count)

  return {
    count,
    format: "offset",
    items,
    next: linkOrFallback(
      nextLink,
      hasNext ? buildOffsetUrl(offset + limit) : undefined,
    ),
    page,
    pageSize: limit > ZERO ? limit : undefined,
    previous: linkOrFallback(
      previousLink,
      offset > ZERO
        ? buildOffsetUrl(Math.max(ZERO, offset - limit))
        : undefined,
    ),
    totalPages,
  }
}

export { normalizeOffsetResponse }
