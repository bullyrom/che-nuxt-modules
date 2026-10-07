/**
 * Returns a copy of the object containing only the given keys
 * (e.g. to build a payload subset out of a larger record).
 */
function filterObjectByKeys<
  ObjectType extends object,
  Keys extends (keyof ObjectType)[],
>(source: ObjectType, keys: Keys): Pick<ObjectType, Keys[number]> {
  const result = {} as Pick<ObjectType, Keys[number]>

  for (const key of keys) result[key] = source[key]

  return result
}

/**
 * Returns a copy of the object with the given keys explicitly reset
 * to `undefined` (e.g. to clear form fields before sending a payload).
 */
function clearObjectFields<ObjectType extends object>(
  source: ObjectType,
  keys: (keyof ObjectType)[],
): ObjectType {
  const cleared: Partial<ObjectType> = {}

  for (const key of keys) cleared[key] = undefined

  return { ...source, ...cleared }
}

/**
 * Returns a copy of the object with every value coerced to a string
 * (`undefined` values are preserved as `undefined`).
 */
function objectValuesToString(
  source: Record<string, boolean | number | string | undefined>,
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {}

  for (const [key, value] of Object.entries(source)) {
    result[key] = value === undefined ? undefined : value.toString()
  }

  return result
}

export { clearObjectFields, filterObjectByKeys, objectValuesToString }
