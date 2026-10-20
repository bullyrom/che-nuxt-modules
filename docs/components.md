# Reusable components — selects, media & date fields

Generic, admin-agnostic building blocks exported from the package root. Use
them directly, or wrap them in project-specific components (URLs, keys, labels)
that then plug into the admin [field API](admin-customization.md#level-1--whole-object-field-group-form--list--detail).

## Selects

### `Select` / `MultiSelect`

Presentational (dumb) selects: they render `{ label, value }` options and emit
the chosen value(s). No data fetching — feed them options and a `showLoader`.

```tsx
<Select
  modelValue={categoryId}
  options={[{ label: "News", value: 1 }]}
  placeholder="Pick a category"
  searchable
  onUpdate:modelValue={(value) => (categoryId = value)}
  onFetchNextPage={loadNextPage}
/>

<MultiSelect
  modelValue={tagIds}
  options={tags}
  searchable
  onUpdate:modelValue={(values) => (tagIds = values)}
/>
```

Props: `modelValue`, `options: SelectOption[]`, `placeholder`, `searchable`,
`disabled`, `showLoader`, `status`. Emits `update:modelValue` and
`fetchNextPage` (drives the internal `LazyLoadList`). The panel closes on
outside click. The search box is exposed with `v-model:search-query`, so a
parent can debounce its own request. The remote selects use exactly that to
pass the term to their options store.

`SelectOption` is `{ label: string; value: unknown }`; `toSelectOptions(records,
labelKey, valueKey)` maps raw API records to options.

### `RemoteSelect` / `RemoteMultiSelect`

Connected selects: they load options from an endpoint through a keyed Pinia
store built on `usePaginatedListApi` (handles **both** a flat array and the
Django `{ count, next, previous, results }` envelope) and paginate with
`LazyLoadList`.

```tsx
<RemoteSelect
  modelValue={categoryId}
  url={`${backendApiUrl}/categories/`}
  labelKey="name"
  valueKey="id"
  searchable
  placeholder="Pick a category"
  onUpdate:modelValue={(value) => (categoryId = value)}
/>

<RemoteMultiSelect
  modelValue={tagIds}
  url={`${backendApiUrl}/tags/`}
  labelKey="title"
  valueKey="id"
  onUpdate:modelValue={(values) => (tagIds = values)}
/>
```

Both are generic over the record type, so `labelKey`/`valueKey` are checked:

```tsx
<RemoteSelect<Category>
  labelKey="name"
  valueKey="id"
  ...
/>
```

Props: `modelValue`, `url`, `labelKey`, `valueKey`, `instanceKey?`, `query?`
(static extra params), `searchParameter?` (default `search`), `searchable?`,
`disabled?`, `placeholder?`, `extraOptions?` (always shown first, e.g. the
current value).

- **Search** — typing in a `searchable` remote select updates the options
  store's `searchQuery`; after the debounce the list request carries
  `searchParameter` (default `search`).
- **Instance key** — each select gets its own keyed options store. One is
  generated per component when `instanceKey` is omitted (SSR-safe); pass one to
  share options between components.
- The options store (`useSelectOptionsStore` / `getSelectOptionsStore`) exposes
  `load`, `loadNextPage`, `options`, `searchQuery`, `showLoader`, `status`.
- `useRemoteSelectOptions({...})` is the underlying composable if you want the
  mapped options without the bundled component.

## Media values (display only)

Plain display components, reusable anywhere (detail cards, custom views):

```tsx
<ImageValue src={record.image} alt="Cover" />   // link + hover preview
<AudioValue src={record.audio} />               // audio player
<VideoValue src={record.video} />               // video player
```

`ImageValue` renders a clickable link and shows the image on hover
(`group-hover`); `href` overrides the link target.

## Field components (admin field API)

These implement the admin field contract
(`{ field?: FieldDescriptor; modelValue; "onUpdate:modelValue" }`) and can be
mapped in the admin config.

- `FileField` — file upload on top of `FileInput` (`accept`, `multiple`).
- `ImageField` / `AudioField` / `VideoField` — show the current media (via the
  value components above) **and** a file input to replace it. Default `accept`
  is `image/*`, `audio/*`, `video/*`.
- `DateField` / `DateTimeField` — `date` / `datetime-local` inputs that
  read/write ISO strings (timezone-safe conversion helpers in `dateInput.ts`).

## Wiring fields into the admin config

Format-driven mapping (most specific), then kind (`defaultComponents`), then
per-field (`overrides`):

```ts
import {
  AudioField,
  DateField,
  DateTimeField,
  ImageField,
  VideoField,
} from "@bullyrom/che-nuxt-modules"

const config = {
  fields: {
    // OpenAPI `format` -> component. `date`/`date-time` are built-in defaults.
    formats: {
      image: ImageField,
      audio: AudioField,
      video: VideoField,
    },
    // OpenAPI kind -> component.
    defaultComponents: { string: MyStringField },
    // Per schema + field override.
    overrides: {
      Record: { cover: { component: ImageField, kind: "string" } },
    },
  },
}
```

- `DEFAULT_FORMAT_COMPONENTS` already maps `date` → `DateField` and
  `date-time` → `DateTimeField`; extend it with `fields.formats`.
- `DEFAULT_FIELD_COMPONENTS` maps every kind to its default component.
- `enum` renders with `EnumField` and long/multiline strings with
  `TextareaField` out of the box — no extra component needed.
- The whole-object field-group overrides (`formOverride` etc.) are documented in
  [admin-customization.md](admin-customization.md).

## Project-specific wrappers

URLs, choice keys and labels belong to the consuming project, not the library.
A project wrapper fixes them and reuses the library component:

```tsx
// frontend: components/admin/TrackChildrenSelect.tsx
export function TrackChildrenSelect(
  props: FieldComponentProperties<number[]>,
) {
  return (
    <RemoteMultiSelect
      modelValue={props.modelValue}
      url={`${backendApiUrl}/tracks/`}
      labelKey="title"
      valueKey="id"
      searchable
      onUpdate:modelValue={props["onUpdate:modelValue"]}
    />
  )
}
```

Then pass it through the config:

```ts
const config = {
  fields: {
    overrides: {
      Track: { children: { component: TrackChildrenSelect, kind: "array" } },
    },
  },
}
```
