# Admin field customization — priorities & component catalog

This is the default checklist for wiring fields into the OpenAPI admin. It ranks
fields by how much they block a valid save, then maps each one to a ready
library component. For the override mechanics see
[admin-customization.md](admin-customization.md); for full prop references see
[components.md](components.md).

## Priorities

### Critical — without them the form saves invalid data

| Field kind                                        | What breaks by default                                              | Use                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Files / uploads                                   | A raw `File` is not JSON; the request must be `multipart/form-data` | `FileField` (and `ImageField` / `AudioField` / `VideoField`) plus a `beforeCreate` / `beforeUpdate` hook that returns `FormData` |
| Foreign keys (`project`, `parent`, `customer`, …) | A free-form id input sends the wrong or an invalid id               | `Select` or `RemoteSelect`                                                                                                       |
| Many-to-many (`tags`, `executors`, …)             | Multiple ids must be sent as a list, not as one value               | `MultiSelect` or `RemoteMultiSelect`                                                                                             |

**The baseline is selects/multi-selects + files.** Wire these before anything
else: without them the create/edit form either cannot be submitted or sends a
payload the backend rejects.

**Enum/choices are already automatic.** When the OpenAPI schema declares
`enum`, the registry selects `EnumField` (`<select>`) without any config — no
manual `EnumField` mapping is needed. Only if a schema loses its choices (a
backend/schema problem) do you need a custom `Select`/`EnumField` override.

### Non-critical — UX improvements

These do not block saving, but make the form much easier to use:

- **Dates / times** — `DateField` / `DateTimeField` (already selected by the
  `date` / `date-time` OpenAPI formats).
- **Image / audio / video display** — `ImageField` / `AudioField` / `VideoField`
  for editing and `ImageValue` / `AudioValue` / `VideoValue` for list/detail
  cards.
- **Long text** — `TextareaField` (already selected for multiline/long
  strings).
- **Numbers with restrictions** — the default number input (wrap it only if you
  need to surface schema `min` / `max` / `step` hints).

## Component catalog

All components below are exported from the package root and accept the admin
field contract (`field`, `modelValue`, `onUpdate:modelValue`) unless marked as
display-only.

| Component                                  | Use for                                                                | Where it goes                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `Select`                                   | Single choice from a known `{ label, value }[]` list (enums, statuses) | `fields.overrides` / `defaultComponents`                                       |
| `MultiSelect`                              | Multiple choices from a known option list                              | `fields.overrides` / `defaultComponents`                                       |
| `RemoteSelect`                             | FK / single choice loaded from an endpoint                             | `fields.overrides` via a thin wrapper that binds `url`, `labelKey`, `valueKey` |
| `RemoteMultiSelect`                        | M2M / multiple choices loaded from an endpoint                         | `fields.overrides` via the same kind of wrapper                                |
| `FileField`                                | File upload (`accept`, `multiple`)                                     | `fields.overrides` / `fields.formats`; needs the multipart hook                |
| `ImageField`                               | Current image preview + replace input                                  | `fields.formats.image` or `fields.overrides`                                   |
| `AudioField`                               | Current audio player + replace input                                   | `fields.formats.audio` or `fields.overrides`                                   |
| `VideoField`                               | Current video player + replace input                                   | `fields.formats.video` or `fields.overrides`                                   |
| `ImageValue` / `AudioValue` / `VideoValue` | Display-only media in custom list/detail groups                        | `entities.<name>.listItemOverride` / `detailOverride`                          |
| `FileValue`                                | Display-only download link in custom groups                            | `entities.<name>.listItemOverride` / `detailOverride`                          |
| `DateField` / `DateTimeField`              | ISO `date` / `date-time` inputs                                        | `fields.formats` (built-in defaults)                                           |
| `EnumField`                                | `<select>` from the schema `enum`                                      | Automatic whenever `schema.enum` exists; no config needed                      |
| `TextareaField`                            | Multi-line text                                                        | Automatic for multiline; map explicitly if needed                              |

## Passing components to `AdminPanelConfig`

Components that need no extra data can be mapped directly:

```ts
import {
  AudioField,
  DateField,
  DateTimeField,
  FileField,
  ImageField,
  TextareaField,
  VideoField,
} from "@bullyrom/che-nuxt-modules"

import type { AdminPanelConfig } from "@bullyrom/che-nuxt-modules"

function toMultipart(payload: Record<string, unknown>) {
  if (!(payload.file instanceof File)) return payload

  const body = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) {
      body.append(key, value as Blob | string)
    }
  }
  return body
}

const config: AdminPanelConfig = {
  fields: {
    formats: {
      image: ImageField,
      audio: AudioField,
      video: VideoField,
      // Built in, listed only to show the mapping:
      date: DateField,
      "date-time": DateTimeField,
    },
    overrides: {
      Track: {
        description: { component: TextareaField, kind: "string" },
        file: { component: FileField, kind: "string" },
        // `track_type` has schema `enum` -> EnumField is automatic.
      },
    },
  },
  hooks: {
    beforeCreate: toMultipart,
    beforeUpdate: toMultipart,
  },
}
```

On update, leave an unchanged file field out of the multipart body instead of
sending the old URL back as a file.

`Select` / `MultiSelect` need an options array, and the remote variants need
`url` / `labelKey` / `valueKey`. Pass them through a thin adapter that binds
those values; the adapter is then used exactly like the direct components:

```tsx
import {
  RemoteSelect,
  type FieldComponentProperties,
} from "@bullyrom/che-nuxt-modules"

function ProjectSelect(props: FieldComponentProperties<number | undefined>) {
  return (
    <RemoteSelect
      labelKey="name"
      modelValue={props.modelValue}
      onUpdate:modelValue={props["onUpdate:modelValue"]}
      searchable
      url={`${backendApiUrl}/record/projects/`}
      valueKey="id"
    />
  )
}

// config.fields.overrides.Track.project =
//   { component: ProjectSelect, kind: "integer" }
```

Use the same pattern for `MultiSelect` / `RemoteMultiSelect` with
`kind: "array"`, and for `Select` when the option list is static.
