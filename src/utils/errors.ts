/** HTTP status code of a missing page. */
const NOT_FOUND_STATUS_CODE = 404

/** Human-readable message of a missing page. */
const NOT_FOUND_STATUS_MESSAGE = "Page Not Found"

/**
 * Creates a fatal Nuxt error that renders the default 404 page.
 * Detail pages call it when the required record cannot be loaded.
 */
export function createDefault404Error() {
  return createError({
    fatal: true,
    statusCode: NOT_FOUND_STATUS_CODE,
    statusMessage: NOT_FOUND_STATUS_MESSAGE,
  })
}
