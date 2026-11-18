const DEFAULT_GRID_COLUMNS = 3

const GRID_COLUMNS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-4",
  5: "grid-cols-1 md:grid-cols-5",
  6: "grid-cols-1 md:grid-cols-6",
}

const DEFAULT_LIST_GRID_CLASS = `grid gap-4 ${GRID_COLUMNS_CLASS[DEFAULT_GRID_COLUMNS]}`

/**
 * Builds the list grid class from a configured number of objects per row.
 * The mobile layout is always one object per row; `md` and wider use the
 * configured count. Omitting the value keeps the default (3 on desktop).
 */
function buildListGridClass(columns: number | undefined): string {
  const value = columns ?? DEFAULT_GRID_COLUMNS
  const columnsClass = GRID_COLUMNS_CLASS[value]
  return columnsClass === undefined
    ? DEFAULT_LIST_GRID_CLASS
    : `grid gap-4 ${columnsClass}`
}

export {
  buildListGridClass,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_LIST_GRID_CLASS,
  GRID_COLUMNS_CLASS,
}
