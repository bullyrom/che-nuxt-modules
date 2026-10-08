<script setup lang="tsx">
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { computed, onMounted, ref } from "vue"

import useRender from "../../composables/useRender"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import ListElementByCurrentDevice from "./ListElementByCurrentDevice.vue"
import SidebarEndpointsMenu from "./SidebarEndpointsMenu.vue"
import { buildAdminThemeStyle, resolveAdminTheme } from "./theme"

import type { AdminPanelConfig } from "./fields/types"
import type { AdminPanelThemeSource } from "./theme"
import type { MyOpenAPIDocument } from "../../stores/adminPanel/types"

interface Properties {
  apiSchema: MyOpenAPIDocument
  baseUrl: string
  config?: AdminPanelConfig
  isMobile?: boolean
  theme?: AdminPanelThemeSource
}

const properties = defineProps<Properties>()

const isReady = ref(false)
onMounted(() => {
  isReady.value = true
})

const adminPanelStore = useAdminPanelStore()
adminPanelStore.setSchema(properties.apiSchema)

const { filteredEntitiesByNamespace } = storeToRefs(adminPanelStore)

const activeTheme = computed(() =>
  resolveAdminTheme(properties.theme ?? properties.config?.theme),
)

const themeStyle = computed<Record<string, string>>(() =>
  buildAdminThemeStyle(activeTheme.value),
)

useRender(() =>
  isReady.value ? (
    <div
      class="ch-admin flex h-[calc(100vh-56px)] gap-3 bg-[var(--ch-admin-bg)] p-3 text-[var(--ch-admin-text)]"
      data-ch-admin-theme={activeTheme.value}
      style={themeStyle.value}
    >
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
