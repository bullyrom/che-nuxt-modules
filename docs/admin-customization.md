# OpenAPI admin panel — customization & embedding

The admin panel is an OpenAPI-driven CRUD UI. It can be used as a whole
(`Crud`), as a per-entity workspace (`EntityWorkspace`) or as separate pieces
(`EntityRecordList`, `EntityRecordDetail`, `EntityCreateForm`,
`SidebarEndpointsMenu`) embedded anywhere in a site.

Two ideas make the customization composable:

- **Instance keys** — every data area (list / detail / form) is registered in a
  dictionary under an `instanceKey`. The built-in admin uses one key
  (`admin-1`) for all entities and reuses it when switching entities. A piece
  embedded elsewhere uses its own key (e.g. `header-message`) and therefore
  creates only its own dictionary entry.
- **One shared config** — the host config is stored once (global store) and is
  never copied per instance. Embedded pieces can also receive a small **config
  fragment** with just the part they need (`AdminListConfig`,
  `AdminDetailConfig`, `AdminFormConfig`).

## Table of contents

1. [Config overview](#config-overview)
2. [Typing](#typing)
3. [Level 1 — whole-object field group (form / list / detail)](#level-1--whole-object-field-group-form--list--detail)
4. [Level 2 — whole list / detail override (+ before/after)](#level-2--whole-list--detail-override--beforeafter)
5. [Level 3 — grid columns](#level-3--grid-columns)
6. [Level 4 — header](#level-4--header)
7. [Level 5 — sidebar](#level-5--sidebar)
8. [Embedding pieces outside the admin](#embedding-pieces-outside-the-admin)
9. [Store structure](#store-structure)

## Config overview

```ts
import type { AdminPanelConfig } from "@bullyrom/che-nuxt-modules"

const config: AdminPanelConfig = {
  gridColumns: 3,
  fields: {
    defaultComponents: {},
    formats: {},
    overrides: {},
  },
  hooks: {
    beforeCreate: (payload) => payload,
    afterCreate: (record) => record,
  },
  menu: {
    hiddenEntities: ["internal-logs"],
    extraLinks: [{ label: "Dashboard", href: "/admin" }],
  },
  views: {
    list: MyList,
    listHeader: MyListHeader,
    listFooter: MyListFooter,
    detail: MyDetail,
    header: MyHeader,
    sidebar: MySidebar,
  },
  entities: {
    records: {
      gridColumns: 2,
      formOverride: {
        component: RecordsFormGroup,
        hiddenFields: ["meta", "tags"],
      },
      detailOverride: {
        component: RecordsDetailGroup,
        hiddenFields: ["meta"],
      },
      listItemOverride: {
        component: RecordsCardGroup,
        hiddenFields: ["meta"],
      },
    },
  },
}
```

Pass it to the admin root:

```tsx
<Crud apiSchema={schema} baseUrl={apiUrl} config={config} />
```

## Typing

`AdminPanelConfig` is generic over an entity-name → object-type map. Describe
that map and every whole-object component (its `value` and typed `onChange`) is
checked against the generated OpenAPI types:

```ts
type Entities = {
  records: RecordApiResponse
  organizations: OrganizationApiResponse
}

const config: AdminPanelConfig<Entities> = {
  entities: {
    records: {
      formOverride: {
        component: RecordsFormGroup, // value: RecordApiResponse
        hiddenFields: ["meta", "tags"],
      },
    },
  },
}
```

## Level 1 — whole-object field group (form / list / detail)

A whole-object component receives the **entire object** and a **typed setter**;
the admin hides the listed fields and keeps rendering the rest normally. The
component can read any field and push only the fields it owns back up.

```tsx
import type { FieldGroupComponentProperties } from "@bullyrom/che-nuxt-modules"

function RecordsFormGroup(
  props: FieldGroupComponentProperties<RecordApiResponse>,
) {
  return (
    <div>
      <input
        value={props.value.meta?.title ?? ""}
        onInput={(event) =>
          props.onChange({
            meta: { ...props.value.meta, title: event.target.value },
          })
        }
      />
      <TagsEditor
        value={props.value.tags}
        onChange={(tags) => props.onChange({ tags })}
      />
    </div>
  )
}
```

Register it per context:

```ts
entities: {
  records: {
    formOverride: { component: RecordsFormGroup, hiddenFields: ["meta", "tags"] },
    detailOverride: { component: RecordsDetailGroup, hiddenFields: ["meta", "tags"] },
    listItemOverride: { component: RecordsCardGroup, hiddenFields: ["meta", "tags"] },
  },
}
```

- Omit `hiddenFields` to own the whole object (all fields pass to the component).
- Form changes update the form model; list/detail changes are applied to the
  record optimistically.
- The standard fields keep rendering **before** the group component. To show
  the group in the middle, render your own component and hide every field the
  admin would render.
- Hiding **all** detail fields is valid: the detail group still renders (it
  replaces the whole detail body).
- Per-field `fields.overrides` is keyed by the request-body schema name; for an
  inline `requestBody` the name is read from its `content.*.schema.$ref`.

## Level 2 — whole list / detail override (+ before/after)

Replace the rendered list or the record detail completely; the logic stays in
the store and is exposed through props (records, `fetchNextPage`, next/previous
URL, count, status, `reload`).

```tsx
import type {
  AdminListComponentProperties,
  AdminDetailComponentProperties,
} from "@bullyrom/che-nuxt-modules"

function MyList(props: AdminListComponentProperties) {
  return (
    <div>
      <p>{props.count} records</p>
      <ul>
        {props.records?.map((record) => (
          <li key={String(record.id)}>{record.id}</li>
        ))}
      </ul>
      {props.showNextPageLoader && (
        <button onClick={props.fetchNextPage}>Load more</button>
      )}
    </div>
  )
}

function MyDetail(props: AdminDetailComponentProperties) {
  return (
    <div>
      <button onClick={props.close}>Close</button>
      <pre>{JSON.stringify(props.record, undefined, 2)}</pre>
    </div>
  )
}

const config = { views: { list: MyList, detail: MyDetail } }
```

**Partial override** — keep everything but inject content above/below the
default list with `listHeader` / `listFooter` (both receive the same props as
`list`):

```ts
const config = {
  views: { listHeader: MyListHeader, listFooter: MyListFooter },
}
```

## Level 3 — grid columns

Objects per row. Global default and per-entity override:

```ts
const config = {
  gridColumns: 4,
  entities: {
    records: { gridColumns: 2 },
  },
}
```

Supported values are `1..6`; unset keeps the default responsive layout.

## Level 4 — header

Replace the list header (title, back button, `+ New`). Realtime changes are no
longer shown in the default header: the list renders a floating "N new" button
in its bottom-right corner (only while changes are pending). The override still
receives `listChangesCount` and `reload` if it wants to render its own control.
The component receives the handlers and calls them itself:

```tsx
import type { AdminHeaderComponentProperties } from "@bullyrom/che-nuxt-modules"

function MyHeader(props: AdminHeaderComponentProperties) {
  return (
    <header>
      <h1>{props.entity?.entityName}</h1>
      {props.canCreate && <button onClick={props.startCreate}>Add</button>}
      {props.listChangesCount > 0 && (
        <button onClick={props.reload}>Reload</button>
      )}
      <button onClick={props.clearEntity}>Back</button>
    </header>
  )
}

const config = { views: { header: MyHeader } }
```

## Level 5 — sidebar

Replace the endpoints menu entirely; it receives the grouped entity list and a
`selectEntity` handler:

```tsx
import type { AdminSidebarComponentProperties } from "@bullyrom/che-nuxt-modules"

function MySidebar(props: AdminSidebarComponentProperties) {
  return (
    <nav>
      {props.groups.map((group) => (
        <section key={group.namespace}>
          <h3>{group.namespace}</h3>
          {group.entities.map((entity) => (
            <button
              key={entity.entityName}
              onClick={() => props.selectEntity(entity)}
            >
              {entity.entityName}
            </button>
          ))}
        </section>
      ))}
      {props.extraLinks.map((link) => (
        <a key={link.href} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  )
}

const config = { views: { sidebar: MySidebar } }
```

**Gentler option** — keep the default menu and only tweak it:

```ts
const config = {
  menu: {
    hiddenEntities: ["internal-logs", "/api/v1/record/internal-logs/"],
    extraLinks: [{ label: "Dashboard", href: "/admin" }],
  },
}
```

## Embedding pieces outside the admin

Each piece takes `instanceKey`, `baseUrl` and (optionally) its own entity. A
piece with a new key creates **only** its own dictionary entry; the shared
config is reused, and the list/detail/form dictionaries of other keys are
untouched.

### List for one entity, with detail links

```tsx
<EntityRecordList
  instanceKey="test-1"
  baseUrl={apiUrl}
  entity={testEntity}
  detailHref={(record) => `/test/${record.id}`}
  listConfig={{ gridColumns: 2 }}
/>
```

- `detailHref` builds the detail URL — the `View` action becomes a link.
- Without `detailHref` (and without `showDetail`), the detail action is hidden.
- In the normal admin the links are produced by the admin itself.

### Detail only

```tsx
<EntityRecordDetail
  instanceKey="header-message"
  baseUrl={apiUrl}
  entity={messageEntity}
  record={message}
  detailConfig={{ override: { component: MessageGroup } }}
/>
```

### Form only

```tsx
<EntityCreateForm
  instanceKey="signup"
  baseUrl={apiUrl}
  entity={userEntity}
  formConfig={{ defaultComponents: { string: MyInput } }}
  @saved="onSaved"
/>
```

### Config fragments

Embedded pieces accept only the fragment they need instead of the whole config:

- `AdminListConfig` — `gridColumns`, `detailHref`, `itemOverride`,
  `list`/`listHeader`/`listFooter`, `defaultComponents`.
- `AdminDetailConfig` — `detail`, `override`.
- `AdminFormConfig` — `overrides`, `defaultComponents`, `formats`, `override`.

Helpers convert a fragment into the store config shape if you build admin
pieces by hand: `listConfigToPanelConfig`, `detailConfigToPanelConfig`,
`formConfigToPanelConfig`.

## Store structure

- `useAdminPanelStore` — the global admin store: schema (+ derived getters),
  active entity, and the **single shared config**.
- `useAdminPanelListStore` / `useAdminPanelDetailStore` /
  `useAdminPanelFormStore` — per-key instance stores (dictionary entries). They
  are created on first use and reused afterwards; `getAdminPanel*Store(key)`
  returns an existing one.
- Inside the admin every entity reuses the `admin-1` key, so switching entities
  never creates new list/detail objects — it only resets and refetches them.
