/** Upper bound of indexed keys probed before giving up. */
const MAX_INDEXED_VALUES = 30

/**
 * Returns a getter that collects every translation of an indexed family of
 * keys (`<key>_1`, `<key>_2`, …) starting from index 1 and stopping at the
 * first missing key. Useful for lists stored as numbered i18n entries.
 *
 * The i18n sources must not leave gaps in the numbering.
 */
export function useGetI18nListValues() {
  const { t: translate, te } = useI18n()

  function get(key: string): string[] {
    const values: string[] = []

    for (let index = 1; index <= MAX_INDEXED_VALUES; index += 1) {
      const formattedKey = `${key}_${index}`
      if (!te(formattedKey)) break
      values.push(translate(formattedKey))
    }

    return values
  }

  return get
}
