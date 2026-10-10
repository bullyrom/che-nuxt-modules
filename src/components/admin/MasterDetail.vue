<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core"
import { computed } from "vue"

import { useMasterDetail } from "./useMasterDetail"

interface Properties {
  /** Whether a detail item is selected and should be shown. */
  detailIsOpen: boolean
  /**
   * Forces compact (mobile) mode. When omitted the `md` breakpoint decides,
   * which keeps the widget dependency-free for host apps that do not care.
   */
  isMobile?: boolean
  /** Show both panes side by side on wide screens (default `true`). */
  splitOnWideScreen?: boolean
}

const properties = withDefaults(defineProps<Properties>(), {
  // Explicit `undefined` defaults keep the boolean props "absent" (Vue would
  // otherwise cast a missing Boolean prop to `false`), so the `??` fallbacks
  // below can still auto-detect the screen and default to a split layout.
  isMobile: undefined,
  splitOnWideScreen: undefined,
})

const breakpoints = useBreakpoints(breakpointsTailwind)
const isSmallScreen = breakpoints.smaller("md")

const isMobile = computed(() => properties.isMobile ?? isSmallScreen.value)

const { showDetail, showMaster } = useMasterDetail({
  detailIsOpen: () => properties.detailIsOpen,
  isMobile,
  splitOnWideScreen: () => properties.splitOnWideScreen ?? true,
})
</script>

<template>
  <div class="flex h-full min-h-0 w-full gap-3">
    <slot v-if="showMaster" name="master" :is-mobile="isMobile" />
    <slot v-if="showDetail" name="detail" :is-mobile="isMobile" />
  </div>
</template>
