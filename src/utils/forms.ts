/** A single choice rendered as a radio option. */
interface RadioOption<Value, Text = string> {
  text: Text
  value: Value
}

/** Parameters describing how a boolean checkbox value is displayed. */
interface BaseCheckboxParameters<Value> {
  falseValue?: Value
  notSelectedInfo?: string
  trueValue?: Value
  value: boolean | null | undefined
}

/**
 * Converts a `{ value: label }` dictionary into a list of radio options,
 * keeping the dictionary key as the option value and the entry as its text.
 */
function choicesToRadioOptions<Label extends string>(
  choices: Record<string, Label>,
): RadioOption<string, Label>[] {
  return Object.entries(choices).map(([key, label]) => ({
    text: label,
    value: key,
  }))
}

/**
 * Returns the label for a boolean checkbox value using the provided
 * true/false labels (`"Да"`/`"Нет"` by default) or the "not selected" text.
 */
function baseCheckboxInfo<Value extends string>(
  settings: BaseCheckboxParameters<Value>,
) {
  if (settings.value === true) return settings.trueValue ?? "Да"
  if (settings.value === false) return settings.falseValue ?? "Нет"
  return settings.notSelectedInfo ?? ""
}

export { baseCheckboxInfo, choicesToRadioOptions }
export type { BaseCheckboxParameters, RadioOption }
