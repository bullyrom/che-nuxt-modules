import ArrayField from "./defaultComponents/ArrayField.vue"
import BooleanField from "./defaultComponents/BooleanField.vue"
import NumberField from "./defaultComponents/NumberField.vue"
import ObjectField from "./defaultComponents/ObjectField.vue"
import StringField from "./defaultComponents/StringField.vue"

import type { FieldComponentRegistry } from "./types"

export const DEFAULT_FIELD_COMPONENTS: FieldComponentRegistry = {
  array: ArrayField,
  boolean: BooleanField,
  integer: NumberField,
  number: NumberField,
  object: ObjectField,
  string: StringField,
}

export { default as TextareaField } from "./defaultComponents/TextareaField.vue"
