/**
 * Type helpers and runtime utilities shared by the generic admin list.
 *
 * A host can render its own records array instead of the store list. The item
 * type is only used for validation: every field of the base entity must exist
 * and match its type in the custom item, except the fields the host renders
 * through their own slots. Extra custom fields are allowed and stay fully typed
 * inside the slots.
 */

const ADMIN_LIST_RESERVED_SLOT_NAMES: readonly string[] = ["default"]

type AdminListBaseKeys<Base> = Extract<keyof Base, string>
type AdminListItemKeys<Item> = Extract<keyof Item, string>
type AdminListCheckedKeys<Base, Item, Overridden extends string> = Exclude<
  AdminListBaseKeys<Base> & AdminListItemKeys<Item>,
  Overridden
>

/**
 * Field names that make a custom item incompatible with the base list item:
 * base fields missing from the item plus shared fields whose types differ.
 * Fields listed in `Overridden` (rendered by a slot) are not checked.
 */
type AdminListIncompatibleKeys<
  Base extends Record<string, unknown>,
  Item extends Record<string, unknown>,
  Overridden extends string = never,
> =
  | Exclude<AdminListBaseKeys<Base>, AdminListItemKeys<Item> | Overridden>
  | {
      [Key in AdminListCheckedKeys<Base, Item, Overridden>]: [
        Item[Key],
      ] extends [Base[Key]]
        ? [Base[Key]] extends [Item[Key]]
          ? never
          : Key
        : Key
    }[AdminListCheckedKeys<Base, Item, Overridden>]

/**
 * The custom item type when it is compatible with the base entity type. The
 * result is `never` for an incompatible item, so a prop typed with it rejects
 * the value at compile time.
 */
type AdminListCompatible<
  Base extends Record<string, unknown>,
  Item extends Record<string, unknown>,
  Overridden extends string = never,
> = [AdminListIncompatibleKeys<Base, Item, Overridden>] extends [never]
  ? Item
  : never

/** A custom records array accepted only when every item passes validation. */
type AdminListCompatibleItems<
  Base extends Record<string, unknown>,
  Item extends Record<string, unknown>,
  Overridden extends string = never,
> = [AdminListIncompatibleKeys<Base, Item, Overridden>] extends [never]
  ? Item[]
  : never

/** Properties handed to the default whole-item slot. */
interface AdminListItemSlotProperties<Item> {
  index: number
  item: Item
}

/** Properties handed to a per-field slot. */
interface AdminListFieldSlotProperties<Item, Value = unknown> {
  index: number
  item: Item
  value: Value
}

/**
 * Per-field slots: one entry per field the host renders itself. Inside a
 * generic component the field key widens to `string`, so the slot value is the
 * union of the item's field values rather than the exact per-key type.
 */
type AdminListFieldSlots<Item extends Record<string, unknown>> = Partial<
  Record<
    AdminListBaseKeys<Item>,
    (
      properties: AdminListFieldSlotProperties<Item, Item[keyof Item]>,
    ) => unknown
  >
>

/** All slots of a generic admin list. */
type AdminListSlots<Item extends Record<string, unknown>> =
  AdminListFieldSlots<Item> & {
    default?: (properties: AdminListItemSlotProperties<Item>) => unknown
  }

/**
 * Returns the runtime slot names that override record fields. The default slot
 * (whole item) is not a field override.
 */
function getAdminListFieldSlotKeys(slotNames: readonly string[]): string[] {
  const reserved = new Set(ADMIN_LIST_RESERVED_SLOT_NAMES)
  return slotNames.filter((name) => !reserved.has(name))
}

/** Reports whether the given field is rendered by its own slot. */
function isAdminListFieldOverridden(
  fieldKey: string,
  fieldSlotKeys: readonly string[],
): boolean {
  return fieldSlotKeys.includes(fieldKey)
}

export type {
  AdminListCompatible,
  AdminListCompatibleItems,
  AdminListFieldSlotProperties,
  AdminListFieldSlots,
  AdminListIncompatibleKeys,
  AdminListItemSlotProperties,
  AdminListSlots,
}
export { getAdminListFieldSlotKeys, isAdminListFieldOverridden }
