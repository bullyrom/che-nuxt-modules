import type { MyOpenAPIDocument } from "./types"

/**
 * Merges loaded OpenAPI documents into one view. Paths and component schemas
 * are combined in spec order (later specs win on an identical key); each entity
 * still resolves its references against its own document, so this merged view
 * is only a convenient summary for hosts and the single-spec `schema` getter.
 */
function mergeOpenApiDocuments(
  documents: readonly MyOpenAPIDocument[],
): MyOpenAPIDocument | undefined {
  const [first, ...rest] = documents
  if (first === undefined) return undefined
  if (rest.length === 0) return first

  const paths: NonNullable<MyOpenAPIDocument["paths"]> = {}
  const schemas: NonNullable<
    NonNullable<MyOpenAPIDocument["components"]>["schemas"]
  > = {}

  for (const document of documents) {
    Object.assign(paths, document.paths)
    Object.assign(schemas, document.components?.schemas)
  }

  return {
    ...first,
    components: { ...first.components, schemas },
    paths,
  }
}

/** Compatibility alias for hosts that call the schema merge directly. */
const mergeSchemas = mergeOpenApiDocuments

export { mergeOpenApiDocuments, mergeSchemas }
