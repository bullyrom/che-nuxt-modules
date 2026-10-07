/**
 * Returns the given fallback result unless the slug is missing,
 * or is the literal string `"null"`/`"undefined"`.
 * Empty strings are treated as valid and return the fallback result.
 */
export function valideSlug(slug: null | string | undefined, result: string) {
  const slugIsMissing =
    slug === undefined ||
    slug === null ||
    slug === "null" ||
    slug === "undefined"

  return slugIsMissing ? "" : result
}
