import type {
  AdminDetailConfig,
  AdminFormConfig,
  AdminListConfig,
  AdminPanelConfig,
} from "./fields/types"

/**
 * Converts an embedded-list config fragment into the full config shape the
 * list store consumes. Only the fields the list needs are populated, so an
 * embedded list never has to carry the whole admin config.
 */
function listConfigToPanelConfig(
  config: AdminListConfig,
  entityName: string | undefined,
): AdminPanelConfig {
  return {
    entities:
      entityName === undefined
        ? undefined
        : {
            [entityName]: {
              gridColumns: config.gridColumns,
              listItemOverride: config.itemOverride,
            },
          },
    fields: { defaultComponents: config.defaultComponents },
    gridColumns: config.gridColumns,
    views: {
      list: config.list,
      listFooter: config.listFooter,
      listHeader: config.listHeader,
    },
  }
}

/** Converts an embedded-detail config fragment into the full config shape. */
function detailConfigToPanelConfig(
  config: AdminDetailConfig,
  entityName: string | undefined,
): AdminPanelConfig {
  return {
    entities:
      entityName === undefined
        ? undefined
        : { [entityName]: { detailOverride: config.override } },
    views: { detail: config.detail },
  }
}

/** Converts an embedded-form config fragment into the full config shape. */
function formConfigToPanelConfig(
  config: AdminFormConfig,
  entityName: string | undefined,
): AdminPanelConfig {
  return {
    entities:
      entityName === undefined
        ? undefined
        : { [entityName]: { formOverride: config.override } },
    fields: {
      defaultComponents: config.defaultComponents,
      overrides: config.overrides,
    },
  }
}

export {
  detailConfigToPanelConfig,
  formConfigToPanelConfig,
  listConfigToPanelConfig,
}
