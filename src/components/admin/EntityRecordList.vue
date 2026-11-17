<script
  setup
  lang="ts"
  generic="
    Base extends Record<string, unknown> = Record<string, unknown>,
    Item extends Record<string, unknown> = Base,
    Overridden extends string = never
  "
>
import MainLoader from "../MainLoader.vue"
import ScrollToTopButton from "../ScrollToTopButton.vue"

import EntityDeleteModal from "./EntityDeleteModal.vue"
import EntityListHeader from "./EntityListHeader.vue"
import EntityRecordCard from "./EntityRecordCard.vue"
import { ADMIN_FLOATING_ACTIONS_CLASSES } from "./layout"
import ListChangesButton from "./ListChangesButton.vue"
import ListFilters from "./ListFilters.vue"
import RawValue from "./RawValue.vue"
import { useEntityRecordList } from "./useEntityRecordList"

import type { AdminListSlots } from "./entityList"
import type { AdminRecordListProperties } from "./useEntityRecordList"

const properties =
  defineProps<AdminRecordListProperties<Base, Item, Overridden>>()
const emit = defineEmits<{
  create: []
  delete: [record: Item]
  edit: [record: Item]
  fetchNextPage: []
  view: [record: Item]
}>()
const slots = defineSlots<AdminListSlots<Item>>()

const {
  canShowDetail,
  clearEntity,
  containerRef,
  customHeader,
  customList,
  customListFooter,
  customListHeader,
  customListProperties,
  deletingRecord,
  displayedItems,
  doDelete,
  entityConfig,
  fallbackValue,
  fetchDataStatus,
  fieldSlotKeys,
  handleDelete,
  handleEdit,
  handleFetchNextPage,
  handlePatch,
  handleView,
  headerProperties,
  instanceConfig,
  isInitialLoading,
  isScrolledDown,
  itemHref,
  lazyShowLoader,
  LIST_FETCH_VISIBLE_ITEM_NUMBER,
  listChangesCount,
  listGridClass,
  listQueryParameters,
  queryValues,
  reload,
  scrollToTop,
  searchQuery,
  showInternalMenu,
  updateIsScrolledDown,
  usesSchemaSearch,
} = useEntityRecordList<Base, Item, Overridden>(
  properties,
  {
    onCreate: () => emit("create"),
    onDelete: (record) => emit("delete", record),
    onEdit: (record) => emit("edit", record),
    onFetchNextPage: () => emit("fetchNextPage"),
    onView: (record) => emit("view", record),
  },
  Object.keys(slots),
)
</script>

<template>
  <div
    class="relative flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)]"
  >
    <component
      :is="customHeader"
      v-if="customHeader"
      v-bind="headerProperties"
    />

    <EntityListHeader
      v-else
      :can-create="headerProperties.canCreate"
      :entity-name="headerProperties.entity?.entityName"
      :full-base-path="headerProperties.entity?.fullBasePath"
      :show-back="showInternalMenu"
      @back="clearEntity()"
      @create="headerProperties.startCreate()"
    />

    <div
      ref="containerRef"
      class="flex-1 overflow-y-auto p-4"
      @scroll="updateIsScrolledDown"
    >
      <component
        :is="customList"
        v-if="customList"
        v-bind="customListProperties"
      />

      <div v-else class="w-full">
        <ListFilters
          v-model:query-values="queryValues"
          v-model:search-query="searchQuery"
          :components="instanceConfig?.fields?.defaultComponents"
          :filters="listQueryParameters.filters"
          :formats="instanceConfig?.fields?.formats"
          :sorts="listQueryParameters.sorts"
          :uses-schema-search="usesSchemaSearch"
        />

        <component
          :is="customListHeader"
          v-if="customListHeader"
          v-bind="customListProperties"
        />

        <div
          v-if="isInitialLoading"
          class="flex h-64 items-center justify-center"
        >
          <MainLoader :wh="40" />
        </div>

        <div
          v-else-if="fetchDataStatus === 'error'"
          class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-danger-text)]"
        >
          Failed to load data
        </div>

        <template v-else-if="fallbackValue !== undefined">
          <div class="mb-3 text-xs text-[var(--ch-admin-text-muted)]">
            This endpoint does not return a list — showing the raw response.
          </div>
          <RawValue :value="fallbackValue" />
        </template>

        <template v-else-if="displayedItems !== undefined">
          <div
            v-if="displayedItems.length === 0"
            class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-text-muted)]"
          >
            No records found
          </div>

          <LazyLoadList
            v-else
            v-slot="{ item, index }"
            :items="displayedItems"
            :show-loader="lazyShowLoader"
            :fetch-visible-item-number="LIST_FETCH_VISIBLE_ITEM_NUMBER"
            :list-class="listGridClass"
            @fetch-next-page="handleFetchNextPage()"
          >
            <slot v-if="$slots.default" :item="item" :index="index" />

            <EntityRecordCard
              v-else
              :index="index"
              :item="item"
              :hidden-fields="entityConfig?.listItemOverride?.hiddenFields"
              :override="entityConfig?.listItemOverride"
              :on-change="(changed) => handlePatch(item, changed)"
              :show-view="canShowDetail"
              :view-href="itemHref(item)"
              @delete="handleDelete"
              @edit="handleEdit"
              @view="handleView"
            >
              <template v-for="slotName in fieldSlotKeys" #[slotName]>
                <slot
                  :name="slotName"
                  :index="index"
                  :item="item as Item"
                  :value="(item as Item)[slotName as keyof Item]"
                />
              </template>
            </EntityRecordCard>
          </LazyLoadList>
        </template>

        <div
          v-else
          class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-text-muted)]"
        >
          No data
        </div>

        <component
          :is="customListFooter"
          v-if="customListFooter"
          v-bind="customListProperties"
        />
      </div>
    </div>

    <div :class="ADMIN_FLOATING_ACTIONS_CLASSES">
      <ListChangesButton :count="listChangesCount" @reload="reload()" />
      <ScrollToTopButton
        :visible="isScrolledDown"
        @scroll-to-top="scrollToTop"
      />
    </div>
  </div>

  <EntityDeleteModal
    :entity-name="headerProperties.entity?.entityName"
    :record="deletingRecord"
    @cancel="deletingRecord = undefined"
    @confirm="doDelete()"
  />
</template>
