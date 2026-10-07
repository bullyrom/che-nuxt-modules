/** Zero-padding width of a day/month number. */
const DATE_PART_LENGTH = 2

/** Number of days in a week. */
const DAYS_IN_WEEK = 7

/** First day-of-month and first month index. */
const FIRST_DAY = 1

/** Last hour/minute/second of a day. */
const LAST_HOUR_OF_DAY = 23
const LAST_MINUTE = 59
const LAST_SECOND = 59

/** Minutes in one hour. */
const MINUTES_PER_HOUR = 60

/** A week inside a month: all day numbers plus its first/last day numbers. */
interface Week {
  dates: (number | undefined)[]
  end?: number
  start: number
}

/**
 * Formats an ISO date string as a Russian `DD.MM.YYYY` date
 * (e.g. `"2025-11-04T00:00:00Z"` -> `"04.11.2025"`).
 */
function dateRussianFormatString(value: string) {
  const date = new Date(value)

  const day = String(date.getDate()).padStart(DATE_PART_LENGTH, "0")
  const month = String(date.getMonth() + 1).padStart(DATE_PART_LENGTH, "0")
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}

/** Returns the localized full month name of the given date. */
function monthName(date: Date, locale: string) {
  return date.toLocaleString(locale, { month: "long" })
}

/** Returns the first day of the month preceding the given date. */
function previousMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, FIRST_DAY)
}

/** Returns the first day of the month following the given date. */
function nextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, FIRST_DAY)
}

/** Returns whether two dates fall on the same calendar day. */
function daysInDatesAreTheSame(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getDate() === secondDate.getDate() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getFullYear() === secondDate.getFullYear()
  )
}

/**
 * Splits a month into ISO weeks (Monday-first). Each week carries its first
 * and last day numbers plus the full day list; with `withEmptyDays` the leading
 * days of the first week are padded with `undefined` so every week has 7 slots.
 */
function getWeeksInMonth(
  date: Date,
  configurations?: { withEmptyDays?: boolean },
): Week[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDate = new Date(year, month, FIRST_DAY)
  const lastDate = new Date(year, month + 1, 0)
  const lastDayDate = lastDate.getDate()

  const weeks: number[][] = []
  // Monday is the first day of the week (`getDay()` returns 0 for Sunday).
  let dayOfWeekCounter = firstDate.getDay() - FIRST_DAY

  for (
    let currentDayDate = FIRST_DAY;
    currentDayDate <= lastDayDate;
    currentDayDate += 1
  ) {
    if (dayOfWeekCounter === 0 || weeks.length === 0) weeks.push([])
    weeks.at(-1)?.push(currentDayDate)
    dayOfWeekCounter = (dayOfWeekCounter + 1) % DAYS_IN_WEEK
  }

  const result: Week[] = weeks.map((week) => ({
    dates: week,
    end: week.at(-1),
    start: week[0] ?? FIRST_DAY,
  }))

  if (configurations?.withEmptyDays === true) {
    const [firstWeek] = result
    if (firstWeek) {
      const emptyDaysCount = DAYS_IN_WEEK - firstWeek.dates.length
      const datesWithEmptyDays: (number | undefined)[] = []
      for (
        let emptyDayNumber = 0;
        emptyDayNumber < emptyDaysCount;
        emptyDayNumber += 1
      ) {
        datesWithEmptyDays.unshift(undefined)
      }
      datesWithEmptyDays.push(...firstWeek.dates)
      firstWeek.dates = datesWithEmptyDays
    }
  }

  return result
}

/** Returns the IANA city name of the current time zone. */
function getCurrentTimeZoneCityName() {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** Returns the current time zone offset in hours (e.g. `3` for MSK). */
function getCurrentTimeZoneOffsetHours() {
  return (new Date().getTimezoneOffset() * -1) / MINUTES_PER_HOUR
}

/** Returns the ISO string of the first day of the given month (local midnight). */
function getIsoDateWithFirstDayInMonth(monthDate: Date) {
  const resultDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    FIRST_DAY,
  )
  return resultDate.toISOString()
}

/**
 * Returns the ISO string of the last day of the given month
 * (local end of day), ready for range queries.
 */
function getIsoDateWithLastDayInMonth(monthDate: Date) {
  const resultDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
    LAST_HOUR_OF_DAY,
    LAST_MINUTE,
    LAST_SECOND,
  )
  return resultDate.toISOString()
}

export {
  dateRussianFormatString,
  daysInDatesAreTheSame,
  getCurrentTimeZoneCityName,
  getCurrentTimeZoneOffsetHours,
  getIsoDateWithFirstDayInMonth,
  getIsoDateWithLastDayInMonth,
  getWeeksInMonth,
  monthName,
  nextMonth,
  previousMonth,
}
export type { Week }
