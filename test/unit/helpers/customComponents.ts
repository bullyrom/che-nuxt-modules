/* eslint-disable vue/one-component-per-file */
import { defineComponent, h } from "vue"

import type { ParsedEntity } from "../../../src/index"

type ChangeHandler = (changed: Record<string, unknown>) => void

const captured: {
  onChange?: ChangeHandler
  value?: Record<string, unknown>
} = {}

const CapturedGroup = defineComponent({
  name: "CapturedGroup",
  props: {
    onChange: { required: true, type: Function },
    value: { required: true, type: Object },
  },
  setup(properties) {
    captured.value = properties.value as Record<string, unknown>
    captured.onChange = properties.onChange as ChangeHandler
    return () =>
      h(
        "div",
        { class: "captured-group" },
        `group-record:${String((properties.value as Record<string, unknown>).name)}`,
      )
  },
})

const FormatField = defineComponent({
  name: "FormatField",
  props: { modelValue: { default: undefined } },
  setup() {
    return () => h("div", { "data-format": "image" }, "image-field")
  },
})

const DefaultStringField = defineComponent({
  name: "DefaultStringField",
  props: { modelValue: { default: "" } },
  setup(properties) {
    return () =>
      h("input", {
        "data-default-string": "true",
        value: String(properties.modelValue ?? ""),
      })
  },
})

const OverrideTitleField = defineComponent({
  name: "OverrideTitleField",
  props: { modelValue: { default: "" } },
  setup() {
    return () => h("div", { "data-override-title": "true" }, "override-title")
  },
})

const ListGroup = defineComponent({
  name: "ListGroup",
  props: {
    onChange: { required: true, type: Function },
    value: { required: true, type: Object },
  },
  setup(properties) {
    const change = properties.onChange as ChangeHandler
    return () =>
      h(
        "button",
        {
          "data-list-group": String(
            (properties.value as Record<string, unknown>).id,
          ),
          onClick: () => change({ title: "Patched title" }),
          type: "button",
        },
        "list-group",
      )
  },
})

const DetailGroup = defineComponent({
  name: "DetailGroup",
  props: {
    onChange: { required: true, type: Function },
    value: { required: true, type: Object },
  },
  setup(properties) {
    const change = properties.onChange as ChangeHandler
    return () =>
      h(
        "button",
        {
          "data-detail-group": "true",
          onClick: () => change({ name: "Renamed" }),
          type: "button",
        },
        `detail-group:${String((properties.value as Record<string, unknown>).name)}`,
      )
  },
})

const CustomList = defineComponent({
  name: "CustomList",
  props: { count: { default: 0, type: Number } },
  setup(properties) {
    return () =>
      h(
        "div",
        { "data-custom-list": "true" },
        `custom-list:${properties.count}`,
      )
  },
})

const ListChrome = defineComponent({
  name: "ListChrome",
  props: { count: { default: 0, type: Number } },
  setup(properties) {
    return () =>
      h("div", { "data-list-chrome": "true" }, `chrome:${properties.count}`)
  },
})

const CustomDetail = defineComponent({
  name: "CustomDetail",
  props: { record: { default: undefined, type: Object } },
  setup(properties) {
    return () =>
      h(
        "div",
        { "data-custom-detail": "true" },
        `custom-detail:${String((properties.record as Record<string, unknown>)?.name)}`,
      )
  },
})

const CustomHeader = defineComponent({
  name: "CustomHeader",
  props: { entity: { default: undefined, type: Object } },
  setup(properties) {
    return () =>
      h(
        "div",
        { "data-custom-header": "true" },
        `custom-header:${String((properties.entity as ParsedEntity | undefined)?.entityName)}`,
      )
  },
})

interface SidebarGroup {
  entities: ParsedEntity[]
}

interface SidebarLink {
  label: string
}

const CustomSidebar = defineComponent({
  name: "CustomSidebar",
  props: {
    extraLinks: { default: () => [], type: Array },
    groups: { default: () => [], type: Array },
    selectEntity: { required: true, type: Function },
  },
  setup(properties) {
    const select = properties.selectEntity as (entity: ParsedEntity) => void
    function renderEntity(entity: ParsedEntity) {
      return h(
        "button",
        {
          "data-sidebar-entity": entity.entityName,
          onClick: () => select(entity),
          type: "button",
        },
        `sidebar:${entity.entityName}`,
      )
    }
    return () =>
      h("nav", { "data-custom-sidebar": "true" }, [
        ...(properties.groups as SidebarGroup[]).flatMap((group) =>
          group.entities.map((entity) => renderEntity(entity)),
        ),
        ...(properties.extraLinks as SidebarLink[]).map((link) =>
          h("a", { "data-sidebar-link": link.label }, link.label),
        ),
      ])
  },
})

export {
  captured,
  CapturedGroup,
  CustomDetail,
  CustomHeader,
  CustomList,
  CustomSidebar,
  DefaultStringField,
  DetailGroup,
  FormatField,
  ListChrome,
  ListGroup,
  OverrideTitleField,
}
