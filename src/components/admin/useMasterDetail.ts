import { computed, toValue } from "vue"

import type { MaybeRefOrGetter } from "vue"

/**
 * Inputs for {@link useMasterDetail}.
 */
interface UseMasterDetailOptions {
  /** Whether a detail item is selected and should be shown. */
  detailIsOpen: MaybeRefOrGetter<boolean>
  /** Whether the layout uses its compact (mobile) mode. */
  isMobile: MaybeRefOrGetter<boolean>
  /**
   * `true` (default) — on wide screens the master and detail panes are shown
   * side by side. `false` — the detail replaces the master on every screen,
   * which turns the widget into drill-down navigation.
   */
  splitOnWideScreen?: MaybeRefOrGetter<boolean>
}

/**
 * Decides which pane of a master-detail widget is visible. The mechanism is
 * pure client state and never touches routing, so it works the same in a Nuxt
 * app and in a plain Vue app:
 *
 * - compact (mobile) mode always shows a single pane — the master until an
 *   item is picked, then the detail;
 * - wide mode shows both panes side by side, unless `splitOnWideScreen` is
 *   `false`, in which case the detail replaces the master everywhere.
 */
function useMasterDetail(options: UseMasterDetailOptions) {
  const isMobile = computed(() => toValue(options.isMobile))
  const detailIsOpen = computed(() => toValue(options.detailIsOpen))
  const splitOnWideScreen = computed(() =>
    options.splitOnWideScreen === undefined
      ? true
      : toValue(options.splitOnWideScreen),
  )

  const showMaster = computed(() =>
    splitOnWideScreen.value
      ? !isMobile.value || !detailIsOpen.value
      : !detailIsOpen.value,
  )

  const showDetail = computed(() =>
    splitOnWideScreen.value
      ? !isMobile.value || detailIsOpen.value
      : detailIsOpen.value,
  )

  return { detailIsOpen, isMobile, showDetail, showMaster }
}

export { useMasterDetail }
export type { UseMasterDetailOptions }
