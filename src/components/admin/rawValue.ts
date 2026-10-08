/**
 * Helpers that turn arbitrary API values into a safe, non-empty text
 * representation. Objects and arrays are pretty-printed as JSON, while plain
 * strings (including huge or binary payloads) are truncated so the admin panel
 * never renders an empty placeholder nor chokes on massive values.
 */

const MAX_TEXT_LENGTH = 400
const MAX_JSON_LENGTH = 20_000
const JSON_INDENT = 2
const EMPTY_PLACEHOLDER = "—"

/**
 * Checks whether a value is a plain keyed record (not an array or null).
 */
function isRecordValue(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Shortens a string to `maxLength` characters and appends the number of
 * dropped characters so large or binary payloads stay bounded.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const remaining = text.length - maxLength
  return `${text.slice(0, maxLength)}… (truncated ${remaining} chars)`
}

/**
 * Converts any value into a non-empty, safe textual representation.
 */
function formatRawValue(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_PLACEHOLDER
  if (typeof value === "string") return truncateText(value, MAX_TEXT_LENGTH)
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (typeof value === "bigint") return value.toString()
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value, undefined, JSON_INDENT)
      return truncateText(json ?? String(value), MAX_JSON_LENGTH)
    } catch {
      return truncateText(String(value), MAX_TEXT_LENGTH)
    }
  }
  return truncateText(String(value), MAX_TEXT_LENGTH)
}

export { formatRawValue, isRecordValue, truncateText }
