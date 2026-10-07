<script setup lang="tsx">
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { onMounted, ref } from "vue"

import useRender from "../../composables/useRender"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import ListElementByCurrentDevice from "./ListElementByCurrentDevice.vue"
import SidebarEndpointsMenu from "./SidebarEndpointsMenu.vue"

import type { AdminPanelConfig } from "./fields/types"
import type { MyOpenAPIDocument } from "../../stores/adminPanel/types"

interface Properties {
  apiSchema: MyOpenAPIDocument
  baseUrl: string
  config?: AdminPanelConfig
  isMobile?: boolean
}

const properties = defineProps<Properties>()

const isReady = ref(false)
onMounted(() => {
  isReady.value = true
})

const adminPanelStore = useAdminPanelStore()
adminPanelStore.setSchema(properties.apiSchema)

const { filteredEntitiesByNamespace } = storeToRefs(adminPanelStore)

useRender(() =>
  isReady.value ? (
    <div class="flex h-[calc(100vh-56px)] bg-white">
      <SidebarEndpointsMenu
        filteredEntitiesByNamespace={filteredEntitiesByNamespace.value}
        isMobile={properties.isMobile}
      />

      <ListElementByCurrentDevice
        baseUrl={properties.baseUrl}
        config={properties.config}
        isMobile={properties.isMobile}
      />
    </div>
  ) : undefined,
)
</script>
