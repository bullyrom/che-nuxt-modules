/** Supported pagination response families. */
type PaginationFormat = "array" | "drf" | "offset" | "page" | "unknown"

/** Format selector: `auto` detects the family from the response body. */
type PaginationFormatOption = "auto" | PaginationFormat

/**
 * Optional overrides for unusual backends. The defaults cover the common DRF,
 * zero-based page and offset/limit envelopes, so hosts normally pass nothing.
 */
interface PaginationAdapterOptions {
  /** Total count key; defaults to `count`, `total`, `total_count`, ... */
  countKey?: string
  /** Force a format instead of auto-detection. */
  format?: PaginationFormatOption
  /** Item array key; defaults to `results`, `data`, `items`, `rows`, `records`. */
  itemsKey?: string
  /** Limit key for offset/limit responses. */
  limitKey?: string
  /** Request query parameter used for the offset limit. */
  limitParam?: string
  /** Next link key; defaults to `next`, `next_page`, `nextPage`, ... */
  nextKey?: string
  /** Offset key for offset/limit responses. */
  offsetKey?: string
  /** Request query parameter used for generated offset links. */
  offsetParam?: string
  /** Result page key; defaults to `current_page`, `currentPage`, `page`. */
  pageKey?: string
  /** Request query parameter used for generated page links. */
  pageParam?: string
  /** Page size key; defaults to `page_size`, `pageSize`, `per_page`, `limit`. */
  pageSizeKey?: string
  /** Request query parameter used for the page size. */
  pageSizeParam?: string
  /** Previous link key; defaults to `previous`, `prev`, `previous_page`, ... */
  previousKey?: string
  /** Total pages key; defaults to `total_pages`, `totalPages`, ... */
  totalPagesKey?: string
}

/** Inputs used while normalizing a response. */
interface PaginationContext {
  options?: PaginationAdapterOptions
  /** Page parsed from the request URL (DRF uses one-based pages). */
  requestedPage?: number
  /** API URL of the request that produced the response. */
  requestUrl?: string
}

/** One normalized pagination page independent of the backend envelope. */
interface NormalizedPagination<Item = unknown> {
  count?: number
  format: PaginationFormat
  items: Item[]
  next: string | undefined
  page?: number
  pageSize?: number
  previous: string | undefined
  totalPages?: number
}

export type {
  NormalizedPagination,
  PaginationAdapterOptions,
  PaginationContext,
  PaginationFormat,
  PaginationFormatOption,
}
