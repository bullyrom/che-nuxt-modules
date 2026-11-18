import type { OpenAPIV3 } from "openapi-types"

const PAGINATION_KEYS = ["count", "next", "previous", "results"] as const

/**
 * Reports whether a list response schema uses the Django pagination envelope
 * (`count`, `next`, `previous`, `results`).
 */
function isPaginatedListSchema(
  schema: OpenAPIV3.SchemaObject | undefined,
): boolean {
  if (!schema || !("properties" in schema)) return false
  const { properties } = schema
  if (!properties || typeof properties !== "object") return false
  const keys = Object.keys(properties)
  return PAGINATION_KEYS.every((key) => keys.includes(key))
}

export { isPaginatedListSchema }
