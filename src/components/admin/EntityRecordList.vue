<script setup lang="ts">
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { provide } from "vue"

import {
  ADMIN_ENTITY_STORE,
  useAdminPanelEntityStore,
} from "../../stores/adminPanel/entity"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import LazyLoadList from "../LazyLoadList.vue"
import MainLoader from "../MainLoader.vue"
import Modal from "../Modal.vue"

import EntityCreateForm from "./EntityCreateForm.vue"
import EntityRecordCard from "./EntityRecordCard.vue"
import EntityRecordDetail from "./EntityRecordDetail.vue"
import MasterDetail from "./MasterDetail.vue"
import QueryParametersMenu from "./QueryParametersMenu.vue"
import RawValue from "./RawValue.vue"

import type { AdminPanelConfig } from "./fields/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  isMobile?: boolean
}

const LIST_CHANGES_HINT = "New changes — click to reload the list"

const properties = defineProps<Properties>()
const adminPanelStore = useAdminPanelStore()

// Only mounted for an active entity (see ListElementByCurrentDevice), so the
// store id is always the current entity and no placeholder store is created.
const store = useAdminPanelEntityStore({
  baseUrl: properties.baseUrl,
  config: properties.config,
  entityPath: adminPanelStore.activeEntity?.fullBasePath ?? "",
})
provide(ADMIN_ENTITY_STORE, store)

const {
  deletingRecord,
  entityRecords,
  fallbackValue,
  fetchDataStatus,
  listChangesCount,
  listQueryParameters,
  queryValues,
  searchQuery,
  showNextPageLoader,
  usesSchemaSearch,
  viewingRecord,
} = storeToRefs(store)

const {
  closeView,
  doDelete,
  fetchNextPage,
  reload,
  startCreate,
  startDelete,
  startEdit,
  startView,
} = store

function handleSaved() {
  reload()
}
</script>

<template>
  <div
    class="flex h-full flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)]"
  >
    <div
      class="flex items-center justify-between border-b border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-4 py-3"
    >
      <button
        class="rounded border border-[var(--ch-admin-border)] px-3 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:text-[var(--ch-admin-text)]"
        @click="adminPanelStore.clearEntity()"
      >
        &larr; All endpoints
      </button>
      <div class="flex items-center gap-3">
        <button
          v-if="listChangesCount > 0"
          class="rounded-full border border-[var(--ch-admin-accent)] px-2.5 py-0.5 text-xs font-medium text-[var(--ch-admin-accent)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
          :title="LIST_CHANGES_HINT"
          @click="reload()"
        >
          {{ listChangesCount }} new
        </button>
        <button
          v-if="adminPanelStore.activeEntity?.createOperation"
          class="rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)] px-3 py-1.5 text-sm font-medium text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
          @click="startCreate()"
        >
          + New
        </button>
        <div class="text-right">
          <h2 class="text-sm font-semibold text-[var(--ch-admin-text)]">
            {{ adminPanelStore.activeEntity?.entityName }}
          </h2>
          <p class="text-xs text-[var(--ch-admin-text-muted)]">
            {{ adminPanelStore.activeEntity?.fullBasePath }}
          </p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <MasterDetail
        :detail-is-open="viewingRecord !== undefined"
        :is-mobile="properties.isMobile"
        :split-on-wide-screen="false"
      >
        <template #detail>
          <EntityRecordDetail
            v-if="viewingRecord"
            :base-url="properties.baseUrl"
            :config="properties.config"
            :record="viewingRecord"
            @close="closeView()"
          />
        </template>

        <template #master>
          <div class="w-full">
            <div class="mb-4 space-y-3">
              <input
                v-if="!usesSchemaSearch"
                v-model="searchQuery"
                class="w-full rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-3 py-1.5 text-sm text-[var(--ch-admin-text)] transition-colors outline-none placeholder:text-[var(--ch-admin-text-muted)] focus:border-[var(--ch-admin-accent)]"
                placeholder="Search..."
                type="text"
              />
              <QueryParametersMenu
                v-model="queryValues"
                :components="properties.config?.fields?.defaultComponents"
                :filters="listQueryParameters.filters"
                :sorts="listQueryParameters.sorts"
              />
            </div>

            <div
              v-if="
                entityRecords === undefined && fetchDataStatus === 'pending'
              "
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
                This endpoint does not return a list — showing the raw
                response.
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
                list-class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
                @fetch-next-page="fetchNextPage()"
              >
                <EntityRecordCard
                  :index="index"
                  :item="item"
                  @delete="startDelete"
                  @edit="startEdit"
                  @view="startView"
                />
              </LazyLoadList>
            </template>

            <div
              v-else
              class="flex h-64 items-center justify-center text-sm text-[var(--ch-admin-text-muted)]"
            >
              No data
            </div>
          </div>
        </template>
      </MasterDetail>
    </div>
  </div>

  <EntityCreateForm
    :base-url="properties.baseUrl"
    :config="properties.config"
    @saved="handleSaved()"
  />

  <Modal
    :show="deletingRecord !== undefined"
    @set-visible="deletingRecord = undefined"
  >
    <div class="px-6 py-5 text-center">
      <p class="text-sm text-[var(--ch-admin-text-muted)]">
        Delete
        {{ adminPanelStore.activeEntity?.entityName ?? "record" }}
        #{{ deletingRecord?.id ?? deletingRecord?.pk ?? "?" }}?
      </p>
      <div class="mt-4 flex justify-center gap-3">
        <button
          class="rounded border border-[var(--ch-admin-border)] px-4 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
          @click="deletingRecord = undefined"
        >
          Cancel
        </button>
        <button
          class="rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          @click="doDelete()"
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
</template>
