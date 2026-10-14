/** Zero-padded numeric length for date/time parts. */
const PAD_LENGTH = 2
/** Days-in-month index offset (JS months are zero-based). */
const MONTH_OFFSET = 1
/** Length of an ISO date part (`YYYY-MM-DD`). */
const DATE_PART_LENGTH = 10

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, "0")
}

/**
 * Converts an ISO string to the value of an `<input type="datetime-local">`
 * (`YYYY-MM-DDTHH:mm`, local time), or `""` when empty/invalid.
 */
function isoToInputDateTime(value: string | undefined): string {
  if (value === undefined || value === "") return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + MONTH_OFFSET)}-${pad(date.getDate())}`
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  return `${datePart}T${timePart}`
}

/** Converts a `datetime-local`/`date` input value to an ISO string. */
function inputToIso(value: string): string | undefined {
  if (value === "") return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/** Converts an ISO string to the value of `<input type="date">` (`YYYY-MM-DD`). */
function isoToInputDate(value: string | undefined): string {
  if (value === undefined || value === "") return ""
  return value.slice(0, DATE_PART_LENGTH)
}

export { inputToIso, isoToInputDate, isoToInputDateTime }
