import { onMounted, ref } from "vue"

import {
  getCurrentTimeZoneCityName,
  getCurrentTimeZoneOffsetHours,
} from "@/utils/date"

/**
 * Reactive current time zone: the IANA city name and the offset in hours.
 * Values are initialised immediately (SSR-safe) and refreshed after mount.
 */
function useCurrentTimeZone() {
  const timeZoneCityName = ref(getCurrentTimeZoneCityName())
  const currentTimeZoneOffsetHours = ref(getCurrentTimeZoneOffsetHours())

  function updateCurrentTimeZone() {
    timeZoneCityName.value = getCurrentTimeZoneCityName()
    currentTimeZoneOffsetHours.value = getCurrentTimeZoneOffsetHours()
  }

  onMounted(updateCurrentTimeZone)

  return {
    currentTimeZoneOffsetHours,
    timeZoneCityName,
    updateCurrentTimeZone,
  }
}

export { useCurrentTimeZone }
