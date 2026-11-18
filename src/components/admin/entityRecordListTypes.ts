import type { AdminListCompatibleItems } from "./entityList"
import type { AdminListConfig, AdminPanelConfig } from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface AdminRecordListProperties<
  Base extends Record<string, unknown>,
  Item extends Record<string, unknown>,
  Overridden extends string,
> {
  baseUrl?: string
  config?: AdminPanelConfig
  /** Detail URL builder; when set the View action becomes a link. */
  detailHref?: (record: Item) => string | undefined
  entity?: ParsedEntity
  /** Finds the entity in the shared schema by admin entity name. */
  entityName?: string
  instanceKey?: string
  isMobile?: boolean
  /**
   * A host-provided records array rendered instead of the fetched list. The
   * item type is checked against the base entity type; fields rendered by their
   * own slots are excluded from the check via `Overridden`.
   */
  items?: AdminListCompatibleItems<Base, Item, Overridden>
  /** Embedded-list config fragment (used when `config` is not passed). */
  listConfig?: AdminListConfig
  /** Narrows the entity lookup when a name exists in several namespaces. */
  namespace?: string
  /** Show an in-place detail action even without a URL builder. */
  showDetail?: boolean
}

/** Host callbacks the list forwards to its parent component. */
interface AdminRecordListActions<Item> {
  onCreate: () => void
  onDelete: (record: Item) => void
  onEdit: (record: Item) => void
  onFetchNextPage: () => void
  onView: (record: Item) => void
}

export type { AdminRecordListActions, AdminRecordListProperties }
