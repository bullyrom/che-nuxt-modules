/**
 * Returns the numeric or string identifier of a record: the conventional `id`
 * field, falling back to Django's `pk`; `undefined` for any other value.
 */
function getRecordId(
  record: Record<string, unknown>,
): number | string | undefined {
  const candidate = record.id ?? record.pk

  return typeof candidate === "number" || typeof candidate === "string"
    ? candidate
    : undefined
}

export { getRecordId }
