<script setup lang="ts">
import type {
  AdminSidebarItemComponent,
  AdminSidebarMenuItem,
} from "./fields/types"

defineOptions({ name: "SidebarMenuNode" })

interface Properties {
  expandedIds: Set<string>
  item: AdminSidebarMenuItem
  itemComponent: AdminSidebarItemComponent
  onSelect: (item: AdminSidebarMenuItem) => void
}

const properties = defineProps<Properties>()
</script>

<template>
  <li>
    <component
      :is="properties.itemComponent"
      :is-active="properties.item.isActive"
      :is-expanded="properties.expandedIds.has(properties.item.id)"
      :item="properties.item"
      :on-select="properties.onSelect"
    />

    <ul
      v-if="
        properties.item.children.length > 0 &&
        properties.expandedIds.has(properties.item.id)
      "
      class="mt-1 space-y-1"
    >
      <SidebarMenuNode
        v-for="child in properties.item.children"
        :key="child.id"
        :expanded-ids="properties.expandedIds"
        :item="child"
        :item-component="properties.itemComponent"
        :on-select="properties.onSelect"
      />
    </ul>
  </li>
</template>
