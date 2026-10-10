<script setup lang="tsx">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core"
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { computed, onMounted, ref } from "vue"

import useRender from "../../composables/useRender"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import ListElementByCurrentDevice from "./ListElementByCurrentDevice.vue"
import MasterDetail from "./MasterDetail.vue"
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

const { activeEntity, filteredEntitiesByNamespace } =
  storeToRefs(adminPanelStore)

const breakpoints = useBreakpoints(breakpointsTailwind)
const isSmallScreen = breakpoints.smaller("md")

// The admin fills its host container; the host page owns the outer spacing and
// the height, the panel owns only its inner spacing (see MasterDetail).
const isMobileLayout = computed(() =>
  properties.isMobile === undefined
    ? isSmallScreen.value
    : properties.isMobile,
)

const activeTheme = computed(() =>
  resolveAdminTheme(properties.theme ?? properties.config?.theme),
)

const themeStyle = computed<Record<string, string>>(() =>
  buildAdminThemeStyle(activeTheme.value),
)

useRender(() =>
  isReady.value ? (
    <div
      class="ch-admin flex h-full min-h-0 w-full bg-[var(--ch-admin-bg)] text-[var(--ch-admin-text)]"
      data-ch-admin-theme={activeTheme.value}
      style={themeStyle.value}
    >
      <MasterDetail
        detailIsOpen={activeEntity.value !== undefined}
        isMobile={isMobileLayout.value}
      >
        {{
          detail: ({ isMobile }: { isMobile: boolean }) => (
            <ListElementByCurrentDevice
              baseUrl={properties.baseUrl}
              config={properties.config}
              isMobile={isMobile}
            />
          ),
          master: ({ isMobile }: { isMobile: boolean }) => (
            <SidebarEndpointsMenu
              filteredEntitiesByNamespace={filteredEntitiesByNamespace.value}
              isMobile={isMobile}
            />
          ),
        }}
      </MasterDetail>
    </div>
  ) : undefined,
)
</script>
