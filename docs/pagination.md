# Pagination formats

`usePaginatedListApi` (and therefore the OpenAPI admin list) auto-detects the
pagination envelope in the response. No per-service frontend code is required.

## Supported envelopes

| Format       | Response keys                                      | Page base         |
| ------------ | -------------------------------------------------- | ----------------- |
| DRF          | `count`, `next`, `previous`, `results`             | one-based links   |
| Page         | `data`, `total_pages`, `current_page`, `page_size` | zero-based        |
| Offset/limit | `data` (or `results`), `total`, `offset`, `limit`  | zero-based offset |
| Plain list   | the response body is the array                     | no paging         |

The page envelope also works when the backend additionally sends `next` and
`previous` as `null`.

## Normalized result

The composable returns the same shape for every format:

| Field                               | Meaning                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `data`                              | page items                                                                                            |
| `count`                             | total item count when the backend provides it (page formats derive it from `total_pages * page_size`) |
| `nextPageUrl` / `previousPageUrl`   | next/previous request URL, generated for page/offset envelopes                                        |
| `page`                              | current page from the backend                                                                         |
| `pageSize`                          | page size from the response, falling back to the item count                                           |
| `totalPages`                        | total pages when known                                                                                |
| `paginationFormat`                  | detected format (`drf`, `page`, `offset`, `array`)                                                    |
| `fetchNextPage`                     | loads and appends the next page                                                                       |
| `showNextPageLoader` / `showFooter` | ready-to-use pagination UI state                                                                      |

Generated links reuse the original request URL and the current query, so search
and filters are kept. Page envelopes use a `page` query parameter; offset
envelopes use `offset` and `limit`.

```ts
const list = usePaginatedListApi<Item[]>({ url: itemsApiPath })

await list.fetchData({ url: itemsApiPath, query: { search: "book" } })
await list.fetchNextPage()
```

Works with all common responses:

```json
{ "count": 12, "next": "…?page=2", "previous": null, "results": [] }
```

```json
{ "data": [], "total_pages": 3, "current_page": 0, "page_size": 20 }
```

```json
{ "data": [], "total": 12, "offset": 0, "limit": 20 }
```

## Optional overrides

Auto-detection covers the common names. Pass `pagination` only when a backend
uses different keys or query parameter names:

```ts
const list = usePaginatedListApi<Item[]>({
  url: itemsApiPath,
  pagination: {
    countKey: "totalCount",
    itemsKey: "rows",
    pageKey: "page",
    pageSizeKey: "perPage",
    // Request query parameters for generated links:
    pageParam: "page",
    pageSizeParam: "per_page",
  },
})
```

All fields are optional; leaving `format` unset (or `"auto"`) keeps detection
on. Force a format with `format: "drf" | "page" | "offset" | "array"`.

The same adapter is exported as `normalizePaginationResponse` for hosts that
consume a response outside the composable.
