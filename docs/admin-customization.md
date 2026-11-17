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
4. **Build custom pages by ID** — reuse the typed
   [list/detail/form stores](#building-custom-pages-from-the-admin-store), the
   generic list and its field slots anywhere in the site.

## Table of contents

1. [Adoption stages](#adoption-stages)
2. [Config overview](#config-overview)
3. [Typing](#typing)
4. [Level 1 — whole-object field group (form / list / detail)](#level-1--whole-object-field-group-form--list--detail)
5. [Level 2 — whole list / detail override (+ before/after)](#level-2--whole-list--detail-override--beforeafter)
6. [Level 3 — grid columns](#level-3--grid-columns)
7. [Filter visibility](#filter-visibility)
8. [Theme](#theme)
9. [Level 4 — header](#level-4--header)
10. [Level 5 — sidebar](#level-5--sidebar)
11. [Embedding pieces outside the admin](#embedding-pieces-outside-the-admin)
12. [Building custom pages from the admin store](#building-custom-pages-from-the-admin-store)
13. [Store structure](#store-structure)

## Config overview

```ts
import type { AdminPanelConfig } from "@bullyrom/che-nuxt-modules"

const config: AdminPanelConfig = {
  gridColumns: 3,
  fields: {
    defaultComponents: {},
    formats: {},
    // Filter parameter keys hidden from every entity list.
    hiddenFilters: ["tenant"],
    overrides: {},
  },
  hooks: {
    beforeCreate: (payload) => payload,
    afterCreate: (record) => record,
  },
  menu: {
    hiddenEntities: ["internal-logs"],
    hiddenPages: ["chapters"],
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
      // Filter keys hidden for this entity only.
      hiddenFilters: ["category", "owner"],
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

Supported values are `1..6`. Unset keeps the default: **3 objects per row
on desktop and 1 on phone**. On phone the list is always one object per row;
`gridColumns: 1` explicitly makes it one object per row on every screen.

## Filter visibility

Hide individual filter parameters without touching the schema or the field
overrides. The parameter is standardized and merged from two levels:

```ts
const config = {
  fields: {
    // Applies to every entity.
    hiddenFilters: ["tenant"],
  },
  entities: {
    records: {
      // Applies to this entity only.
      hiddenFilters: ["category", "owner"],
    },
  },
}

// Embedded list fragment:
const listConfig = { hiddenFilters: ["category"] }
```

Sorting parameters are not affected — hiding a field from the filter panel does
not remove an explicit sort. The built-in list header is unchanged.

## Theme

Every admin root sets the theme CSS variables. `Crud` sets them on its own
container; embedded pieces (`EntityRecordList`, `EntityRecordDetail`,
`EntityCreateForm`) now set the same variables on their root too, so they keep
their borders, surfaces and modals visible **outside** the admin and support
both themes:

```ts
const config = {
  // "dark" (default) | "light" or a ref/getter supplied by the host.
  theme: "light",
}
```

The host still owns the surrounding page: pass its color mode through
`config.theme` (or `theme` on `Crud`). The library does not depend on a color-mode
package.

The create modal uses the themed overlay with an opaque fallback, so it is never
transparent even when the host does not define the admin variables itself.

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

### Reading the endpoint menu data yourself

`SidebarEndpointsMenu` and `SidebarEndpointsList` render the menu model from
`useAdminMenuSections`. The same composable is exported from the package root,
so a host can build its own navigation from exactly the data the built-in
sidebar uses (groups, hidden entities, extra links, nesting and the active
entity all come from `useAdminPanelStore` + the config).

```tsx
<script setup lang="tsx">
import { useAdminMenuSections, useAdminPanelStore, useRender } from "@bullyrom/che-nuxt-modules"

const adminPanelStore = useAdminPanelStore()
adminPanelStore.setSchema(schema)
adminPanelStore.setConfig(config)

// Omitted args read the shared store and its config.
const { sections } = useAdminMenuSections({ showGroups: true })

function SiteNavigation() {
  return (
    <nav>
      {sections.value.map((section) => (
        <section key={section.id}>
          {section.title && <h3>{section.title}</h3>}
          <ul>
            {section.items.map((item) => (
              <li key={item.id}>
                <a
                  href={
                    item.href ??
                    (item.entity
                      ? `/admin/endpoints/${item.entity.entityName}`
                      : "#")
                  }
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}

useRender(() => <SiteNavigation />)
</script>
```

- `sections` is a reactive `MenuSection[]`:
  `{ id, title?, items }`, where each `AdminSidebarMenuItem` has
  `id`, `label`, `href?`, `entity?` (the parsed endpoint), `children`,
  `isActive` and `level`.
- The composable accepts the same overrides as `SidebarEndpointsList`:
  `config`, `extraLinks`, `filteredEntitiesByNamespace`, `hiddenEntities` and
  `showGroups`; omitted values fall back to the store config.
- Use `useAdminMenuSections({ showGroups: false })` for one flat list, then read
  `section.items[].entity` for the endpoints you want to render.
- If you only need the raw parsed data, the exported `useAdminPanelStore()`
  already exposes `parsedEntities` (all entities) and
  `filteredEntitiesByNamespace` (list entities grouped by namespace);
  `useAdminMenuSections` is the layer that applies the config, hidden entities,
  custom links, ordering and nesting on top of them.
- If you also need the sidebar's expansion state, `useSidebarMenu` is exported
  too and returns the same `sections` plus `expandedIds`, `itemComponent` and
  `toggleItem`.

### Config fragments

Embedded pieces accept only the fragment they need instead of the whole config:

- `AdminListConfig` — `gridColumns`, `hiddenFilters`, `detailHref`,
  `itemOverride`, `list`/`listHeader`/`listFooter`, `defaultComponents`.
- `AdminDetailConfig` — `detail`, `override`.
- `AdminFormConfig` — `overrides`, `defaultComponents`, `formats`, `override`.

Helpers convert a fragment into the store config shape if you build admin
pieces by hand: `listConfigToPanelConfig`, `detailConfigToPanelConfig`,
`formConfigToPanelConfig`.

## Building custom pages from the admin store

The admin pieces are not a separate data layer: the same keyed list/detail/form
stores can drive a completely custom page. There are two levels:

1. **Typed `useAdminEntity`** — the ready-made getters, setters and actions for
   one entity and one instance key. Write only the page-specific logic.
2. **`EntityRecordList` with your own records** — keep the list chrome and the
   store while supplying your own item type and field slots.

### 1. Register the schema once

`useAdminEntity` resolves the entity by name from the shared admin store and
falls back to its base URL, so set both once (for example in a plugin or in the
page setup):

```ts
const adminPanelStore = useAdminPanelStore()
adminPanelStore.setSchema(schema)
adminPanelStore.setBaseUrl(apiUrl)
adminPanelStore.setConfig(config)
```

`Crud` does the same automatically when it is mounted; a custom page that uses
no `Crud` must call these setters itself.

### 2. Typed `useAdminEntity`

Describe the entity map from the generated OpenAPI types and pass the entity
name + an instance key:

```ts
import { useAdminEntity } from "@bullyrom/che-nuxt-modules"

type Book =
  paths["/api/v1/catalog/books/"]["get"]["responses"][200]["content"]["application/json"]["results"][number]

interface Entities {
  books: Book
  chapters: Chapter
}

const books = useAdminEntity<Entities, "books">({
  entityName: "books",
  instanceKey: "custom-books",
})

// Different key -> an independent copy of the same entity.
const booksSidebar = useAdminEntity<Entities, "books">({
  entityName: "books",
  instanceKey: "custom-books-sidebar",
})

const { list, detail, form, mutations, showLoader } = books

list.records // Ref<Book[] | undefined>
list.count // Ref<number | undefined>
list.page // Ref<number | undefined>
list.nextPageUrl // Ref<null | string | undefined>
list.previousPageUrl // Ref<null | string | undefined>
list.showFooter // ComputedRef<boolean>
list.showNextPageLoader // ComputedRef<boolean>
list.isPaginated // ComputedRef<boolean>
list.fetchNextPage() // appends the next Django page
list.reload()

detail.record // ComputedRef<Book | undefined>
detail.startView(book) // typed record
detail.closeView()

form.form // Ref<Partial<Book>>
form.startCreate()
form.startEdit(book)
form.submitForm()

mutations.startDelete(book)
mutations.update({ id: String(book.id), data: { name: "New" } })
```

- `showLoader` merges the list, detail and form statuses (ignoring `idle`), so
  the host does not rebuild the status chain.
- Pass `baseUrl` / `config` in the parameters to override the values from the
  shared store for this instance only.
- `useAdminEntity` only casts and curries the keyed stores: all requests still go
  through the Pinia stores, never through components.

### 3. Custom records with `EntityRecordList`

Pass `entityName` + `instanceKey` to fetch the store list, or `items` to render
your own records array. The item type is checked against the base entity type;
extra custom fields are allowed and fully typed inside slots.

```tsx
import type { BookCard } from "~/types/bookCard"

interface Book {
  id: number
  name: string
  status: string
}

// BookCard = Book & { meta: { tags: string[] } }
const cards: BookCard[] = await loadCards()

// Base = Book, Item = BookCard; "meta" is rendered by its own slot.
<EntityRecordList<Book, BookCard, "meta">
  items={cards}
  instanceKey="book-cards"
  detailHref={(card) => `/books/${card.id}`}
  v-slots={{
    meta: ({ item }) => <TagList tags={item.meta.tags} />,
    default: ({ item }) => <BookCardView book={item} />,
  }}
/>
```

- **No `items`** (or `items={undefined}`): the component fetches its own list via
  the keyed store; the item type defaults to the base entity type.
- **With `items`**: no fetch is started, pagination is delegated to the host
  (`@fetch-next-page` / `v-slots` controls); `delete` is emitted and is not sent
  to the API automatically.
- `default` replaces the whole card. Named field slots override a single field
  and receive `{ item, index, value }`; the item is typed by `Item`.
- The third generic is the union of fields rendered by **field** slots. Those
  fields are excluded from the compatibility check, so a slot may change a field
  type or omit it. Without the slot, an incompatible field is a compile error.

```tsx
// Error: name is number in the item but string in the base entity
<EntityRecordList<Book, { id: number; name: number; status: string }>
  items={cards}
  instanceKey="book-cards"
/>

// OK: name is rendered by its slot, so it is excluded from the check
<EntityRecordList<
  Book,
  { id: number; name: number; status: string },
  "name"
>
  items={cards}
  instanceKey="book-cards"
  v-slots={{ name: ({ item }) => <NameInput value={item.name} /> }}
/>
```

Runtime slot keys are discoverable with `getAdminListFieldSlotKeys(
Object.keys(slots))`; the same helper is exported for hosts that build their own
list. **Type-level** slot keys cannot be inferred from Vue slots (slots are not
part of a component's generic signature), so the overridden union is passed
explicitly as the third generic. The compatibility type is exported as
`AdminListCompatible<Base, Item, Overridden>` / `AdminListIncompatibleKeys` for
building equivalent wrappers.

### 4. Entities used only inside another page

Mark a child entity with `menu.hiddenPages` when it has no standalone page and
is rendered only inside a parent page. It is hidden from the menu exactly like
`hiddenEntities`, but its list stays reusable:

```ts
const config = {
  menu: {
    // Existing option: hide from the menu only.
    hiddenEntities: ["internal-logs"],
    // Used only inside the books page -> no standalone page and no menu row.
    hiddenPages: ["chapters"],
  },
}
```

```tsx
// Parent book page: reuse the child list with its own instance key.
<EntityRecordList
  entityName="chapters"
  instanceKey="book-chapters"
  detailHref={(chapter) => `/chapters/${chapter.id}`}
/>
```

`resolveHiddenEntityKeys(menu)` merges `hiddenEntities` + `hiddenPages`, and
`isAdminEntityPageHidden(entity, menu)` is exported so the host router can refuse
a standalone route for a page-only entity. Both are also honoured by
`useAdminMenuSections`, the built-in sidebar and `Crud`.

## Store structure

- `useAdminPanelStore` — the global admin store: schema (+ derived getters),
  active entity, and the **single shared config**.
- `useAdminPanelListStore` / `useAdminPanelDetailStore` /
  `useAdminPanelFormStore` — per-key instance stores (dictionary entries). They
  are created on first use and reused afterwards; `getAdminPanel*Store(key)`
  returns an existing one.
- Inside the admin every entity reuses the `admin-1` key, so switching entities
  never creates new list/detail objects — it only resets and refetches them.
