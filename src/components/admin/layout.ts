/** Header row shared by the admin list and detail areas (no separator stripe). */
const ADMIN_AREA_HEADER_CLASSES = "flex items-center justify-between gap-3"

/** List header keeps the area padding while sharing the detail header style. */
const ADMIN_LIST_HEADER_CLASSES = `${ADMIN_AREA_HEADER_CLASSES} px-4 py-3`

/** Subtle bordered action used for the "back" controls. */
const ADMIN_BACK_BUTTON_CLASSES =
  "rounded border border-[var(--ch-admin-border)] px-3 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:text-[var(--ch-admin-text)]"

/** Bottom-right stack that floats over a scrolling admin area. */
const ADMIN_FLOATING_ACTIONS_CLASSES =
  "absolute right-4 bottom-4 z-20 flex flex-col items-end gap-2"

export {
  ADMIN_AREA_HEADER_CLASSES,
  ADMIN_BACK_BUTTON_CLASSES,
  ADMIN_FLOATING_ACTIONS_CLASSES,
  ADMIN_LIST_HEADER_CLASSES,
}
