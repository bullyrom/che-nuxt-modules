/** One rendered option of a select: a display label and an arbitrary value. */
interface SelectOption {
  label: string
  value: unknown
}

/** Shared control styling; falls back to neutral colors outside the admin. */
const SELECT_FIELD_CLASS =
  "w-full rounded border border-[var(--ch-admin-border,#d1d5db)] bg-[var(--ch-admin-surface,#fff)] px-3 py-2 text-sm text-[var(--ch-admin-text,#111827)] transition-colors outline-none focus:border-[var(--ch-admin-accent,#3b5cf6)]"

/** Shared dropdown-panel styling. */
const SELECT_PANEL_CLASS =
  "absolute z-20 mt-1 w-full overflow-hidden rounded border border-[var(--ch-admin-border,#d1d5db)] bg-[var(--ch-admin-surface,#fff)] shadow-lg"

/**
 * Maps raw API records to `{ label, value }` options using the given record
 * keys. Reused by the remote selects and by project-specific wrappers.
 */
function toSelectOptions<RecordType extends Record<string, unknown>>(
  records: RecordType[] | undefined,
  labelKey: keyof RecordType,
  valueKey: keyof RecordType,
): SelectOption[] {
  if (records === undefined) return []
  return records.map((record) => ({
    label: String(record[labelKey] ?? ""),
    value: record[valueKey],
  }))
}

export { SELECT_FIELD_CLASS, SELECT_PANEL_CLASS, toSelectOptions }
export type { SelectOption }
