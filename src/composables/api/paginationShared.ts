import { readLink } from "./paginationUrl"

import type {
  PaginationAdapterOptions,
  PaginationFormat,
} from "./paginationTypes"

const ITEM_KEYS = ["results", "data", "items", "rows", "records"] as const
const COUNT_KEYS = [
  "count",
  "total",
  "total_count",
  "totalCount",
  "total_items",
  "totalItems",
] as const
const PAGE_KEYS = [
  "current_page",
  "currentPage",
  "page_number",
  "pageNumber",
  "page",
] as const
const PAGE_SIZE_KEYS = [
  "page_size",
  "pageSize",
  "per_page",
  "perPage",
  "limit",
  "size",
] as const
const TOTAL_PAGES_KEYS = [
  "total_pages",
  "totalPages",
  "page_count",
  "pageCount",
  "pages",
] as const
const NEXT_KEYS = [
  "next",
  "next_page",
  "nextPage",
  "next_url",
  "nextUrl",
] as const
const PREVIOUS_KEYS = [
  "previous",
  "previous_page",
  "previousPage",
  "prev",
  "prev_page",
  "prevPage",
  "previous_url",
  "previousUrl",
  "prevUrl",
] as const
const OFFSET_KEYS = ["offset", "from"] as const
const LIMIT_KEYS = [
  "limit",
  "page_size",
  "pageSize",
  "per_page",
  "perPage",
] as const
const PAGE_QUERY_CANDIDATES = [
  "page",
  "current_page",
  "page_number",
  "pageNumber",
] as const
const PAGE_SIZE_QUERY_CANDIDATES = [
  "page_size",
  "pageSize",
  "per_page",
  "perPage",
  "limit",
] as const
const OFFSET_QUERY_CANDIDATES = ["offset", "skip"] as const
const LIMIT_QUERY_CANDIDATES = [
  "limit",
  "page_size",
  "pageSize",
  "per_page",
  "perPage",
] as const
const ZERO = 0

/** A link explicitly set to `false` means "the backend has no such page". */
type ExplicitLink = false | string | undefined

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function withOption(
  option: string | undefined,
  defaults: readonly string[],
): string[] {
  return option === undefined
    ? [...defaults]
    : [option, ...defaults.filter((key) => key !== option)]
}

function hasAnyKey(
  record: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => Object.hasOwn(record, key))
}

/** Detects the response family; an explicit `format` always wins. */
function detectPaginationFormat(
  record: Record<string, unknown>,
  itemKey: string,
  options: PaginationAdapterOptions,
): PaginationFormat {
  if (options.format !== undefined && options.format !== "auto") {
    return options.format
  }
  // Page markers win over next/previous because some page APIs also include
  // null next/previous fields.
  if (
    hasAnyKey(record, [
      "current_page",
      "currentPage",
      "total_pages",
      "totalPages",
    ])
  ) {
    return "page"
  }
  if (hasAnyKey(record, [...OFFSET_KEYS, ...LIMIT_KEYS])) return "offset"
  if (
    hasAnyKey(record, NEXT_KEYS) ||
    hasAnyKey(record, PREVIOUS_KEYS) ||
    (itemKey === "results" && hasAnyKey(record, COUNT_KEYS))
  ) {
    return "drf"
  }
  if (hasAnyKey(record, ["page_size", "pageSize", "per_page", "perPage"])) {
    return "page"
  }
  if (hasAnyKey(record, COUNT_KEYS)) return "offset"
  return "array"
}

/** Reads an explicit next/previous link. */
function explicitLink(
  record: Record<string, unknown>,
  optionKey: string | undefined,
  defaults: readonly string[],
  buildFromNumber: (value: number) => string | undefined,
): ExplicitLink {
  const link = readLink(record, withOption(optionKey, defaults))
  if (link === undefined) return undefined
  if (link.value === null) return false
  if (typeof link.value === "string") return link.value
  if (typeof link.value === "number") return buildFromNumber(link.value)
  return undefined
}

/** Uses an explicit link when present, otherwise the generated fallback. */
function linkOrFallback(
  link: ExplicitLink,
  fallback: string | undefined,
): string | undefined {
  if (link === false) return undefined
  return link ?? fallback
}

export {
  COUNT_KEYS,
  detectPaginationFormat,
  explicitLink,
  hasAnyKey,
  isRecord,
  ITEM_KEYS,
  LIMIT_KEYS,
  LIMIT_QUERY_CANDIDATES,
  linkOrFallback,
  NEXT_KEYS,
  OFFSET_KEYS,
  OFFSET_QUERY_CANDIDATES,
  PAGE_KEYS,
  PAGE_QUERY_CANDIDATES,
  PAGE_SIZE_KEYS,
  PAGE_SIZE_QUERY_CANDIDATES,
  PREVIOUS_KEYS,
  readNumber,
  TOTAL_PAGES_KEYS,
  withOption,
  ZERO,
}
