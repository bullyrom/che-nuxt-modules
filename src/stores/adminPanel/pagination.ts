import type { OpenAPIV3 } from "openapi-types"

const DRF_PAGINATION_KEYS = ["count", "next", "previous", "results"] as const
const PAGE_PAGINATION_KEYS = [
  "data",
  "total_pages",
  "current_page",
  "page_size",
] as const
const OFFSET_PAGINATION_KEYS = ["data", "total", "offset", "limit"] as const
const OFFSET_RESULTS_PAGINATION_KEYS = [
  "results",
  "total",
  "offset",
  "limit",
] as const

function schemaPropertyKeys(schema: OpenAPIV3.SchemaObject): string[] {
  if (!("properties" in schema)) return []
  const { properties } = schema
  if (!properties || typeof properties !== "object") return []
  return Object.keys(properties)
}

/**
 * Reports whether a list response schema uses one of the built-in pagination
 * envelopes: DRF, zero-based total_pages/current_page/page_size or offset/limit.
 */
function isPaginatedListSchema(
  schema: OpenAPIV3.SchemaObject | undefined,
): boolean {
  if (!schema) return false
  const keys = schemaPropertyKeys(schema)
  function hasAll(expected: readonly string[]): boolean {
    return expected.every((key) => keys.includes(key))
  }

  return (
    hasAll(DRF_PAGINATION_KEYS) ||
    hasAll(PAGE_PAGINATION_KEYS) ||
    hasAll(OFFSET_PAGINATION_KEYS) ||
    hasAll(OFFSET_RESULTS_PAGINATION_KEYS)
  )
}

export { isPaginatedListSchema }
