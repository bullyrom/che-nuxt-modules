import {
  COUNT_KEYS,
  explicitLink,
  linkOrFallback,
  NEXT_KEYS,
  PAGE_KEYS,
  PAGE_QUERY_CANDIDATES,
  PAGE_SIZE_KEYS,
  PAGE_SIZE_QUERY_CANDIDATES,
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

/** Normalizes a zero-based `data/total_pages/current_page/page_size` page. */
function normalizePageResponse<Item>(
  response: Record<string, unknown>,
  items: Item[],
  context: PaginationContext,
): NormalizedPagination<Item> {
  const options = context.options ?? {}
  const count = readNumber(response, withOption(options.countKey, COUNT_KEYS))
  const pageSize =
    readNumber(response, withOption(options.pageSizeKey, PAGE_SIZE_KEYS)) ??
    items.length
  const page =
    readNumber(response, withOption(options.pageKey, PAGE_KEYS)) ??
    context.requestedPage ??
    ZERO
  let totalPages = readNumber(
    response,
    withOption(options.totalPagesKey, TOTAL_PAGES_KEYS),
  )
  if (totalPages === undefined && count !== undefined && pageSize > ZERO) {
    totalPages = Math.ceil(count / pageSize)
  }
  const normalizedCount =
    count ??
    (totalPages !== undefined && pageSize > ZERO
      ? totalPages * pageSize
      : undefined)

  const pageParameter =
    options.pageParam ??
    findQueryParameter(context.requestUrl, PAGE_QUERY_CANDIDATES) ??
    "page"
  const pageSizeParameter =
    options.pageSizeParam ??
    findQueryParameter(context.requestUrl, PAGE_SIZE_QUERY_CANDIDATES)
  const sizeParameters =
    pageSizeParameter === undefined ? {} : { [pageSizeParameter]: pageSize }
  function buildPageUrl(targetPage: number): string | undefined {
    return buildUrlWithQuery(context.requestUrl, {
      ...sizeParameters,
      [pageParameter]: targetPage,
    })
  }

  const nextLink = explicitLink(
    response,
    options.nextKey,
    NEXT_KEYS,
    buildPageUrl,
  )
  const previousLink = explicitLink(
    response,
    options.previousKey,
    PREVIOUS_KEYS,
    buildPageUrl,
  )
  const hasNext = totalPages !== undefined && page + 1 < totalPages
  const hasPrevious = page > ZERO

  return {
    count: normalizedCount,
    format: "page",
    items,
    next: linkOrFallback(
      nextLink,
      hasNext ? buildPageUrl(page + 1) : undefined,
    ),
    page,
    pageSize: pageSize > ZERO ? pageSize : undefined,
    previous: linkOrFallback(
      previousLink,
      hasPrevious ? buildPageUrl(page - 1) : undefined,
    ),
    totalPages,
  }
}

export { normalizePageResponse }
