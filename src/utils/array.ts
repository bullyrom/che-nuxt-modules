/** Smallest allowed chunks of an array. */
const MIN_CHUNK_SIZE = 1

/**
 * Splits an array into consecutive chunks of at most `chunkSize` items
 * (e.g. to render menu columns). A non-positive `chunkSize` returns the
 * original array as a single chunk.
 */
function chunkArray<Item>(items: Item[], chunkSize: number): Item[][] {
  if (chunkSize < MIN_CHUNK_SIZE) return [items]

  const result: Item[][] = []
  for (let index = 0; index < items.length; index += chunkSize) {
    result.push(items.slice(index, index + chunkSize))
  }

  return result
}

export { chunkArray }
