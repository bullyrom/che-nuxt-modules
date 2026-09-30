import { isString } from "lodash-es"

/** Number of digits in one thousands group. */
const GROUP_SIZE = 3

/** Separator inserted between digit groups. */
const THOUSANDS_SEPARATOR = " "

/**
 * Groups the integer part of a number into three-digit chunks,
 * separated by a space (e.g. `1234567` -> `1 234 567`).
 */
export function divideNumber(value: number | string) {
  const stringValue = isString(value) ? value : value.toString()
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
