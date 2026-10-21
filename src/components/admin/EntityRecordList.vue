<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed } from "vue"

import { useScrollToTop } from "../../composables/useScrollToTop"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import { resolveEntityConfig } from "../../stores/adminPanel/instance"
import { useAdminPanelListStore } from "../../stores/adminPanel/list"
import LazyLoadList from "../LazyLoadList.vue"
import MainLoader from "../MainLoader.vue"
import ScrollToTopButton from "../ScrollToTopButton.vue"

import { listConfigToPanelConfig } from "./config"
import EntityDeleteModal from "./EntityDeleteModal.vue"
import EntityListHeader from "./EntityListHeader.vue"
import EntityRecordCard from "./EntityRecordCard.vue"
import { buildListGridClass } from "./grid"
import { ADMIN_FLOATING_ACTIONS_CLASSES } from "./layout"
import ListChangesButton from "./ListChangesButton.vue"
import ListFilters from "./ListFilters.vue"
import RawValue from "./RawValue.vue"

import type {
  AdminHeaderComponentProperties,
  AdminListComponentProperties,
  AdminListConfig,
  AdminPanelConfig,
} from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  /** Detail URL builder; when set the View action becomes a link. */
  detailHref?: (record: Record<string, unknown>) => string | undefined
  entity?: ParsedEntity
  instanceKey?: string
  isMobile?: boolean
  /** Embedded-list config fragment (used when `config` is not passed). */
  listConfig?: AdminListConfig
  /** Show an in-place detail action even without a URL builder. */
  showDetail?: boolean
}

const properties = defineProps<Properties>()
const emit =
  defineEmits<(event: "create" | "edit" | "view", record?: unknown) => void>()

const adminPanelStore = useAdminPanelStore()

const store = useAdminPanelListStore({
  baseUrl: properties.baseUrl,
  config: properties.config,
  entity: () => properties.entity,
  instanceKey: properties.instanceKey ?? "admin-1",
})

const {
  count,
  deletingRecord,
  entityRecords,
  fallbackValue,
  fetchDataStatus,
  listChangesCount,
  listQueryParameters,
  nextPageUrl,
  previousPageUrl,
  queryValues,
  searchQuery,
  showNextPageLoader,
  usesSchemaSearch,
} = storeToRefs(store)

const { doDelete, fetchNextPage, patchRecord, reload } = store

const { containerRef, isScrolledDown, scrollToTop, updateIsScrolledDown } =
  useScrollToTop()

const currentEntity = computed(
  () => properties.entity ?? adminPanelStore.activeEntity,
)
const listFragmentConfig = computed(() =>
  properties.listConfig === undefined
    ? undefined
    : listConfigToPanelConfig(
        properties.listConfig,
        currentEntity.value?.entityName,
      ),
)
const instanceConfig = computed(
  () =>
    properties.config ?? listFragmentConfig.value ?? adminPanelStore.config,
)
const entityConfig = computed(() =>
  resolveEntityConfig(instanceConfig.value, currentEntity.value),
)

const detailHref = computed(
  () => properties.detailHref ?? properties.listConfig?.detailHref,
)
const canShowDetail = computed(
  () => properties.showDetail === true || detailHref.value !== undefined,
)

const customList = computed(() => instanceConfig.value?.views?.list)
const customListHeader = computed(
  () => instanceConfig.value?.views?.listHeader,
)
const customListFooter = computed(
  () => instanceConfig.value?.views?.listFooter,
)
const customHeader = computed(() => instanceConfig.value?.views?.header)

const gridColumns = computed(
  () => entityConfig.value?.gridColumns ?? instanceConfig.value?.gridColumns,
)
const listGridClass = computed(() => buildListGridClass(gridColumns.value))

// The database-backed list starts loading in `onMounted`, after the server has
// already rendered the shell. Treat `idle` (SSR) and `pending` (first client
// fetch) as the same loading state so hydration sees identical markup.
const isInitialLoading = computed(
  () =>
    entityRecords.value === undefined &&
    (fetchDataStatus.value === "idle" || fetchDataStatus.value === "pending"),
)

const customListProperties = computed<AdminListComponentProperties>(() => ({
  count: count.value,
  detailHref: detailHref.value,
  entityName: currentEntity.value?.entityName,
  fetchNextPage,
  gridColumns: gridColumns.value,
  nextPageUrl: nextPageUrl.value ?? undefined,
  previousPageUrl: previousPageUrl.value ?? undefined,
  records: entityRecords.value,
  reload,
  showNextPageLoader: showNextPageLoader.value,
  startCreate: () => emit("create"),
  status: fetchDataStatus.value,
}))

const headerProperties = computed<AdminHeaderComponentProperties>(() => ({
  canCreate: Boolean(currentEntity.value?.createOperation),
  clearEntity: () => adminPanelStore.clearEntity(),
  entity: currentEntity.value,
  listChangesCount: listChangesCount.value,
  reload: () => {
    reload()
  },
  startCreate: () => emit("create"),
}))

function handlePatch(item: unknown, changed: Record<string, unknown>) {
  if (item && typeof item === "object") {
    patchRecord(item as Record<string, unknown>, changed)
  }
}

function itemHref(item: unknown): string | undefined {
  const buildHref = detailHref.value
  if (buildHref === undefined) return undefined
  if (item === null || typeof item !== "object") return undefined
  return buildHref(item as Record<string, unknown>)
}
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
      :can-create="Boolean(currentEntity?.createOperation)"
      :entity-name="currentEntity?.entityName"
      :full-base-path="currentEntity?.fullBasePath"
      @back="adminPanelStore.clearEntity()"
      @create="emit('create')"
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

        <template v-else-if="entityRecords !== undefined">
          <div
            v-if="entityRecords.length === 0"
            class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-text-muted)]"
          >
            No records found
          </div>

          <LazyLoadList
            v-else
            v-slot="{ item, index }"
            :items="entityRecords"
            :show-loader="showNextPageLoader"
            :fetch-visible-item-number="4"
            :list-class="listGridClass"
            @fetch-next-page="fetchNextPage()"
          >
            <EntityRecordCard
              :index="index"
              :item="item"
              :hidden-fields="entityConfig?.listItemOverride?.hiddenFields"
              :override="entityConfig?.listItemOverride"
              :on-change="(changed) => handlePatch(item, changed)"
              :show-view="canShowDetail"
              :view-href="itemHref(item)"
              @delete="store.startDelete"
              @edit="(record) => emit('edit', record)"
              @view="(record) => emit('view', record)"
            />
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
    :entity-name="currentEntity?.entityName"
    :record="deletingRecord"
    @cancel="deletingRecord = undefined"
    @confirm="doDelete()"
  />
</template>
