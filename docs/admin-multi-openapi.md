# Multiple OpenAPI specs in the admin

The admin can consume several OpenAPI documents at once (for example a
`catalog` service and a `support` service). Each spec keeps its own API origin
and its own store scope, while the panel presents one merged entity list.

## Registering specs

Pass `specs` to `Crud`. A spec has an `id` (the service namespace), an optional
`label` (menu title), an optional `baseUrl` (request origin) and either an
inline `schema` or a `url` the library loads it from.

```tsx
import { Crud } from "@bullyrom/che-nuxt-modules"
import type { AdminOpenApiSpec } from "@bullyrom/che-nuxt-modules"

const specs: AdminOpenApiSpec[] = [
  {
    id: "catalog",
    label: "Catalog",
    baseUrl: "https://catalog.example.test",
    url: "https://catalog.example.test/openapi.json",
  },
  {
    id: "support",
    label: "Support",
    baseUrl: "https://support.example.test",
    schema: supportSchema,
  },
]

export function Admin() {
  return <Crud specs={specs} config={config} />
}
```

Specs with `url` are loaded once on mount; inline schemas are used as-is. The
same registry is available programmatically from the shared store:

```ts
const adminPanelStore = useAdminPanelStore()
await adminPanelStore.loadSpecs(specs)
// or, when the schemas are already loaded:
adminPanelStore.setSpecs(specs)
```

The merged entity list is available as `parsedEntities`; `schema` exposes the
combined document (`paths` plus component schemas) for a quick overview, while
each entity still resolves `$ref`s against its own spec. `setSchema(schema,
{ id, label, baseUrl })` still works and registers a single spec, so existing
single-spec pages do not need to change.

## Entity keys and references

Inside the admin every entity gets the internal key `service:entity` (the
service is the spec `id`). Two entities with the same short name in different
specs therefore never collide.

Public helpers (`useAdminEntity`, `EntityRecordList`, `findAdminEntity`,
`resolveAdminEntity`) accept:

- the full `service:entity` key, always;
- the bare entity name, only when it is unique across the connected specs.

```ts
resolveAdminEntity(entities, "catalog:books") // always allowed
resolveAdminEntity(entities, "tickets") // allowed when unique
resolveAdminEntity(entities, "tasks") // throws when several specs have `tasks`
```

An ambiguous or unknown reference raises `AdminEntityResolutionError`; its
message lists the variants (`catalog:tasks, support:tasks`) or the available
entities. `tryResolveAdminEntity` returns `undefined` instead.

`useAdminEntity` accepts either mode, and the types follow it:

```ts
interface Entities {
  "catalog:books": Book
  "support:tickets": Ticket
}

useAdminEntity<Entities, "catalog:books">({
  entityKey: "catalog:books",
  instanceKey: "books",
})

useAdminEntity<Entities, "tickets">({
  entityName: "tickets", // short name, allowed because it is unique
  instanceKey: "tickets",
})
```

## Config, stores and hidden entities

Entity-specific config and menu hiding use the same key:

```ts
const config: AdminPanelConfig = {
  entities: {
    "catalog:books": { gridColumns: 2 },
    "support:tickets": { gridColumns: 1 },
  },
  menu: {
    hiddenEntities: ["support:tickets", "internal-logs"],
  },
}
```

The bare name is still accepted for single-spec configs. Per-entity store
instances are isolated by the service id, so the same `instanceKey` under two
specs does not share list/detail/form state.

Requests go to the owning spec's `baseUrl`; the `Crud` `baseUrl` prop remains a
fallback for specs without one.

## Menu groups and labels

With several loaded specs the default menu groups entities by service and uses
the spec `label` as the group title. With one spec the previous grouping by API
path namespace is kept.

Labels are short by default. A short name is prefixed with its service only when
another connected spec declares the same name. The behavior is configurable:

```ts
const config: AdminPanelConfig = {
  menu: {
    // "auto" (default) | "prefix" | "name"; booleans are accepted too.
    entityLabel: "auto",
    // Alias: true = always prefix, false = never prefix.
    entityLabelPrefix: "auto",
  },
}
```

## Single-spec compatibility

A page can keep using exactly the old shape:

```tsx
<Crud apiSchema={schema} baseUrl="https://api.example.test" config={config} />
```

Short names, `hiddenEntities` by name/path, namespace grouping, and config
entries keyed by the bare entity name all keep working. Internally that schema
is registered as the `default` service, so the full key form
(`default:books`) is also available.
