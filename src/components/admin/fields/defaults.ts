import ArrayField from "./defaultComponents/ArrayField.vue"
import BooleanField from "./defaultComponents/BooleanField.vue"
import DateField from "./defaultComponents/DateField.vue"
import DateTimeField from "./defaultComponents/DateTimeField.vue"
import NumberField from "./defaultComponents/NumberField.vue"
import ObjectField from "./defaultComponents/ObjectField.vue"
import StringField from "./defaultComponents/StringField.vue"

import type { FieldComponent, FieldComponentRegistry } from "./types"

export const DEFAULT_FIELD_COMPONENTS: FieldComponentRegistry = {
  array: ArrayField,
  boolean: BooleanField,
  integer: NumberField,
  number: NumberField,
  object: ObjectField,
  string: StringField,
}

/**
 * Default components dispatched by the OpenAPI field `format` (a more specific
 * choice than the kind). Hosts extend this via `fields.formats`.
 */
export const DEFAULT_FORMAT_COMPONENTS: Partial<
  Record<string, FieldComponent>
> = {
  date: DateField,
  "date-time": DateTimeField,
}

export { default as TextareaField } from "./defaultComponents/TextareaField.vue"
