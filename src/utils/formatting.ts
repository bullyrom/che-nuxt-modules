import { isString } from "lodash-es"

/** Number of digits in one thousands group. */
const GROUP_SIZE = 3

/** Separator inserted between digit groups. */
const THOUSANDS_SEPARATOR = " "

/** A plain decimal number (optional sign, optional fraction), nothing else. */
const PLAIN_NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/v

/**
 * Groups the integer part of a number into three-digit chunks,
 * separated by a space (e.g. `1234567` -> `1 234 567`).
 *
 * Values that are not plain decimal numbers (already pre-formatted with
 * spaces, exponential notation, `NaN`, etc.) are returned unchanged, so the
 * helper is safe to call on both raw numbers and already-formatted strings.
 * The fractional part is preserved as-is.
 */
export function divideNumber(value: number | string) {
  const stringValue = isString(value) ? value : value.toString()

  if (!PLAIN_NUMBER_PATTERN.test(stringValue)) return stringValue

  const [integerPart = "", fractionalPart] = stringValue.split(".")

  let groupedInteger = ""
  for (let index = integerPart.length; index > 0; index -= GROUP_SIZE) {
    const chunk = integerPart.slice(Math.max(0, index - GROUP_SIZE), index)
    groupedInteger = groupedInteger
      ? `${chunk}${THOUSANDS_SEPARATOR}${groupedInteger}`
      : chunk
  }

  return fractionalPart === undefined
    ? groupedInteger
    : `${groupedInteger}.${fractionalPart}`
}
