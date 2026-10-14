<script setup lang="ts">
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { computed } from "vue"

import { useAdminPanelDetailStore } from "../../stores/adminPanel/detail"
import { useAdminPanelFormStore } from "../../stores/adminPanel/form"
import { useAdminPanelListStore } from "../../stores/adminPanel/list"

import EntityCreateForm from "./EntityCreateForm.vue"
import EntityRecordDetail from "./EntityRecordDetail.vue"
import EntityRecordList from "./EntityRecordList.vue"
import MasterDetail from "./MasterDetail.vue"

import type { AdminPanelConfig } from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  entity?: ParsedEntity
  instanceKey?: string
  isMobile?: boolean
}

const properties = defineProps<Properties>()

const instanceKey = computed(() => properties.instanceKey ?? "admin-1")
const instanceParameters = computed(() => ({
  baseUrl: properties.baseUrl,
  config: properties.config,
  entity: () => properties.entity,
  instanceKey: instanceKey.value,
}))

const listStore = useAdminPanelListStore(instanceParameters.value)
const detailStore = useAdminPanelDetailStore(instanceParameters.value)
const formStore = useAdminPanelFormStore(instanceParameters.value)

const { viewingRecord } = storeToRefs(detailStore)
const { startView } = detailStore
const { startCreate, startEdit } = formStore
const { reload } = listStore
</script>

<template>
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
        :instance-key="instanceKey"
        :entity="properties.entity"
        :record="viewingRecord"
      />
    </template>

    <template #master>
      <EntityRecordList
        :base-url="properties.baseUrl"
        :config="properties.config"
        :instance-key="instanceKey"
        :is-mobile="properties.isMobile"
        :entity="properties.entity"
        show-detail
        @create="startCreate()"
        @edit="startEdit"
        @view="startView"
      />
    </template>
  </MasterDetail>

  <EntityCreateForm
    :base-url="properties.baseUrl"
    :config="properties.config"
    :instance-key="instanceKey"
    :entity="properties.entity"
    @saved="reload()"
  />
</template>
