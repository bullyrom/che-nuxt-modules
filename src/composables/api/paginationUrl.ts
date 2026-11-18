const LOCAL_BASE_URL = "http://localhost"

interface LinkValue {
  found: boolean
  value: null | number | string | undefined
}

function hasKey(record: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(record, key)
}

/** Returns the first finite numeric value among the candidate keys. */
function readNumber(
  record: Record<string, unknown>,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    if (hasKey(record, key)) {
      const value = record[key]
      if (typeof value === "number" && Number.isFinite(value)) return value
    }
  }
  return undefined
}

/** Reads the first present link; a present `null` means "no such page". */
function readLink(
  record: Record<string, unknown>,
  keys: readonly string[],
): LinkValue | undefined {
  for (const key of keys) {
    if (hasKey(record, key)) {
      const value = record[key]
      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number"
      ) {
        return { found: true, value }
      }
    }
  }
  return undefined
}

/** Finds which of the candidate query parameters the URL already uses. */
function findQueryParameter(
  requestUrl: string | undefined,
  candidates: readonly string[],
): string | undefined {
  if (!requestUrl) return undefined
  try {
    const url = new URL(requestUrl, LOCAL_BASE_URL)
    return candidates.find((candidate) => url.searchParams.has(candidate))
  } catch {
    return undefined
  }
}

/** Adds/replaces query parameters while keeping relative URLs relative. */
function buildUrlWithQuery(
  requestUrl: string | undefined,
  parameters: Record<string, number | string | undefined>,
): string | undefined {
  if (!requestUrl) return undefined
  const isAbsolute =
    /^[a-z][\d+\-.a-z]*:/iv.test(requestUrl) || requestUrl.startsWith("//")
  try {
    const url = new URL(requestUrl, LOCAL_BASE_URL)
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
    return isAbsolute
      ? url.toString()
      : `${url.pathname}${url.search}${url.hash}`
  } catch {
    return requestUrl
  }
}

export { buildUrlWithQuery, findQueryParameter, readLink, readNumber }
export type { LinkValue }
