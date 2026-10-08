<script setup lang="tsx">
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { computed, onMounted, ref, unref } from "vue"

import useRender from "../../composables/useRender"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import ListElementByCurrentDevice from "./ListElementByCurrentDevice.vue"
import SidebarEndpointsMenu from "./SidebarEndpointsMenu.vue"
import { buildAdminThemeStyle, DEFAULT_ADMIN_PANEL_THEME } from "./theme"

import type { AdminPanelConfig } from "./fields/types"
import type { AdminPanelTheme } from "./theme"
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

const activeTheme = computed<AdminPanelTheme>(() => {
  const { theme } = properties.config ?? {}
  if (theme === undefined) return DEFAULT_ADMIN_PANEL_THEME
  return unref(theme)
})

const themeStyle = computed<Record<string, string>>(() =>
  buildAdminThemeStyle(activeTheme.value),
)

useRender(() =>
  isReady.value ? (
    <div
      class="ch-admin flex h-[calc(100vh-56px)] bg-[var(--ch-admin-bg)] text-[var(--ch-admin-text)]"
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
