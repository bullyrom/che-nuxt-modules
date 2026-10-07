import { computed, ref } from "vue"

import {
  monthName as getMonthName,
  nextMonth as getNextMonth,
  previousMonth as getPreviousMonth,
  getWeeksInMonth,
} from "@/utils/date"

/**
 * Reactive month/day calendar state: the visible month, the selected day and
 * the month split into weeks (Monday-first, padded so every week has 7 slots).
 * `locale` is passed to the localized month name.
 */
function useCalendar(locale: string) {
  const monthDate = ref(new Date())
  const dayDate = ref<Date | undefined>(new Date())

  const weeksInMonthWithEmptyDays = computed(() =>
    getWeeksInMonth(monthDate.value, { withEmptyDays: true }),
  )
  const monthName = computed(() => getMonthName(monthDate.value, locale))
  const year = computed(() => monthDate.value.getFullYear())

  function previousMonth() {
    monthDate.value = getPreviousMonth(monthDate.value)
    dayDate.value = undefined
  }

  function nextMonth() {
    monthDate.value = getNextMonth(monthDate.value)
    dayDate.value = undefined
  }

  function setMonthDate(date: Date) {
    monthDate.value = date
  }

  function setDayDate(date: Date) {
    dayDate.value = date
  }

  /** Builds a `Date` for the given day number inside the visible month. */
  function getDayDateInMonthDate(dayNumber: number) {
    const cloneDate = new Date(monthDate.value)
    cloneDate.setDate(dayNumber)
    return cloneDate
  }

  function setNowDayAndMonthDates() {
    setMonthDate(new Date())
    setDayDate(new Date())
  }

  return {
    dayDate,
    getDayDateInMonthDate,
    monthDate,
    monthName,
    nextMonth,
    previousMonth,
    setDayDate,
    setMonthDate,
    setNowDayAndMonthDates,
    weeksInMonthWithEmptyDays,
    year,
  }
}

export { useCalendar }
