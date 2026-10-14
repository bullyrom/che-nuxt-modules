const DEFAULT_LIST_GRID_CLASS =
  "grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"

const GRID_COLUMNS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
}

/**
 * Builds the list grid class from a configured number of objects per row,
 * falling back to the default responsive layout when unset or unsupported.
 */
function buildListGridClass(columns: number | undefined): string {
  if (columns === undefined) return DEFAULT_LIST_GRID_CLASS
  const columnsClass = GRID_COLUMNS_CLASS[columns]
  return columnsClass === undefined
    ? DEFAULT_LIST_GRID_CLASS
    : `grid gap-4 ${columnsClass}`
}

export { buildListGridClass, DEFAULT_LIST_GRID_CLASS, GRID_COLUMNS_CLASS }
