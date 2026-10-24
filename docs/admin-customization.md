# OpenAPI admin panel — customization & embedding

The admin panel is an OpenAPI-driven CRUD UI. It can be used as a whole
(`Crud`), as a per-entity workspace (`EntityWorkspace`) or as separate pieces
(`EntityRecordList`, `EntityRecordDetail`, `EntityCreateForm`,
`SidebarEndpointsMenu` / bare `SidebarEndpointsList`) embedded anywhere in a
site.

Field priorities and the ready component catalog are in
[admin-fields.md](admin-fields.md).

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

## Adoption stages

1. **Deploy from OpenAPI** — render `Crud` (or the routed pieces) with the
   schema and base URL.
2. **Customize fields** — wire the critical fields first (selects, files,
   enums); see [admin-fields.md](admin-fields.md).
3. **Extract/reuse the menu by instance ID** — hide the internal menu with
   `menu.showInAdmin: false` and render the bare `SidebarEndpointsList` in the
   site sidebar with the same `instanceKey`, `extraLinks` and
   `hiddenEntities`.
4. **Future — any pages/pieces by ID** — reuse other keyed admin pieces from
   the store (lists, details, forms) anywhere in the site.

## Table of contents

1. [Adoption stages](#adoption-stages)
2. [Config overview](#config-overview)
3. [Typing](#typing)
4. [Level 1 — whole-object field group (form / list / detail)](#level-1--whole-object-field-group-form--list--detail)
5. [Level 2 — whole list / detail override (+ before/after)](#level-2--whole-list--detail-override--beforeafter)
6. [Level 3 — grid columns](#level-3--grid-columns)
7. [Level 4 — header](#level-4--header)
8. [Level 5 — sidebar](#level-5--sidebar)
9. [Embedding pieces outside the admin](#embedding-pieces-outside-the-admin)
10. [Store structure](#store-structure)

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
    extraLinks: [
      { label: "Dashboard", href: "/admin" },
      { label: "Docs", href: "/admin/docs", parent: "Dashboard" },
    ],
    // Group API entities by namespace (default true in the admin).
    showGroups: true,
    // Show the built-in endpoints menu inside the admin (default true).
    showInAdmin: true,
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

The built-in endpoints menu is shown inside the admin by default. Set
`menu.showInAdmin: false` when the host renders its own navigation (for example
the main site sidebar); the workspace then takes the full width.

Two renderers share one item system:

- `SidebarEndpointsMenu` — framed admin wrapper (border, header, scroll area)
  grouped by API namespace; `menu.showGroups` defaults to `true` here.
- `SidebarEndpointsList` — bare list (no frame/header/padding), flat by default
  (`showGroups` defaults to `false`) for site sidebars.

All rows — endpoint items and `extraLinks` — are rendered by the same item
component with the same size, full-width hover and padding. Custom rows are
**components**, not slots: pass `itemComponent` (or
`config.menu.itemComponent`). It receives the item (`label`, `href`, `entity`,
`children`, `level`), `isActive`, `isExpanded` and `onSelect`:

```tsx
import type { AdminSidebarItemProperties } from "@bullyrom/che-nuxt-modules"

function MyMenuItem(props: AdminSidebarItemProperties) {
  return props.item.href === undefined ? (
    <button onClick={() => props.onSelect(props.item)}>
      {props.item.label}
    </button>
  ) : (
    <a href={props.item.href} onClick={() => props.onSelect(props.item)}>
      {props.item.label}
    </a>
  )
}

function AdminMenuExample() {
  return (
    <SidebarEndpointsMenu
      config={config}
      instanceKey="admin-1"
      itemComponent={MyMenuItem}
    />
  )
}
```

Links use the same rows and support nesting and ordering:

```ts
const config = {
  menu: {
    extraLinks: [
      { href: "/", id: "site", index: 2, label: "Site" },
      { href: "/docs", index: 0, label: "Docs", parent: "site" },
    ],
  },
}
```

- `parent` / `parentId` reference another item's `id` (or its `href`/label); an
  item without a parent is level 1. Parent rows stay clickable and toggle their
  children.
- `index` moves an item among its siblings; an out-of-range index is ignored.
- Grouping only changes headings/flatness; nesting and `index` work in both
  grouped and flat modes.

To replace the menu entirely inside the admin, use `views.sidebar`; it receives
the grouped entity list and a `selectEntity` handler:

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

### Sidebar menu only

Use the bare `SidebarEndpointsList` in the main site sidebar: it renders only
the unified items (no frame, header or padding) and is flat by default — API
items and site links share one list. It is exported from the package root
together with the framed `SidebarEndpointsMenu`:

```tsx
import { SidebarEndpointsList } from "@bullyrom/che-nuxt-modules"

const adminPanelStore = useAdminPanelStore()
adminPanelStore.setSchema(schema)
adminPanelStore.setConfig(config)

function SiteSidebar() {
  return (
    <SidebarEndpointsList
      config={config}
      extraLinks={[
        { href: "/", id: "site", label: "Site" },
        { href: "/docs", label: "Docs", parent: "site", index: 0 },
      ]}
      hiddenEntities={["internal-logs"]}
      instanceKey="admin-1"
      onSelectEntity={(entity) =>
        navigateTo(`/admin/endpoints/${entity.entityName}`)
      }
    />
  )
}
```

- Use the same `instanceKey` as the admin; selecting an entity closes that
  instance's open record, exactly like the admin sidebar.
- `config.menu.extraLinks` / `config.menu.hiddenEntities` /
  `config.menu.itemComponent` / `config.menu.showGroups` are used when the
  same-named props are omitted; the props win when both are passed.
- Site links are ordinary items: they use the same row component, and support
  `parent` / `parentId` and `index`.
- Groups are read from the shared `useAdminPanelStore` by default (load the
  schema there first). Pass `filteredEntitiesByNamespace` when the host has
  already prepared its own groups.
- Set `menu.showInAdmin: false` on the admin config when the site sidebar is the
  only menu, so the admin does not render its internal one. Pass
  `showGroups`/`menu.showGroups: true` if the site menu should keep API groups.

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
