<script setup lang="tsx">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core"
import { storeToRefs } from "pinia"
import { computed, onMounted, ref } from "vue"

import useRender from "../../composables/useRender"
import { getAdminPanelDetailStore } from "../../stores/adminPanel/detail"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import ListElementByCurrentDevice from "./ListElementByCurrentDevice.vue"
import MasterDetail from "./MasterDetail.vue"
import { visibleMenuGroups } from "./menu"
import SidebarEndpointsMenu from "./SidebarEndpointsMenu.vue"
import { buildAdminThemeStyle, resolveAdminTheme } from "./theme"

import type {
  AdminPanelConfig,
  AdminSidebarComponentProperties,
} from "./fields/types"
import type { AdminPanelThemeSource } from "./theme"
import type {
  MyOpenAPIDocument,
  ParsedEntity,
} from "../../stores/adminPanel/types"

interface Properties {
  apiSchema: MyOpenAPIDocument
  baseUrl: string
  config?: AdminPanelConfig
  instanceKey?: string
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
adminPanelStore.setConfig(properties.config)

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

const instanceKey = computed(() => properties.instanceKey ?? "admin-1")

const activeTheme = computed(() =>
  resolveAdminTheme(properties.theme ?? properties.config?.theme),
)

const themeStyle = computed<Record<string, string>>(() =>
  buildAdminThemeStyle(activeTheme.value),
)

const instanceConfig = computed(
  () => properties.config ?? adminPanelStore.config,
)
const customSidebar = computed(() => instanceConfig.value?.views?.sidebar)
const extraLinks = computed(() => instanceConfig.value?.menu?.extraLinks ?? [])

// Hidden entities (by name or full path) are dropped from the default menu.
const visibleGroups = computed(() =>
  visibleMenuGroups(
    filteredEntitiesByNamespace.value,
    instanceConfig.value?.menu?.hiddenEntities,
  ),
)

function selectEntity(entity: ParsedEntity) {
  getAdminPanelDetailStore(instanceKey.value)?.closeView()
  adminPanelStore.activeEntity = entity
}

const sidebarProperties = computed<AdminSidebarComponentProperties>(() => ({
  activeEntity: activeEntity.value,
  extraLinks: extraLinks.value,
  groups: visibleGroups.value,
  isMobile: isMobileLayout.value,
  selectEntity,
}))

useRender(() => {
  if (!isReady.value) return undefined

  const CustomSidebar = customSidebar.value

  return (
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
              instanceKey={instanceKey.value}
              isMobile={isMobile}
              key={activeEntity.value?.fullBasePath ?? "none"}
            />
          ),
          master: ({ isMobile }: { isMobile: boolean }) =>
            CustomSidebar ? (
              <CustomSidebar
                activeEntity={sidebarProperties.value.activeEntity}
                extraLinks={sidebarProperties.value.extraLinks}
                groups={sidebarProperties.value.groups}
                isMobile={sidebarProperties.value.isMobile}
                selectEntity={sidebarProperties.value.selectEntity}
              />
            ) : (
              <SidebarEndpointsMenu
                extraLinks={extraLinks.value}
                filteredEntitiesByNamespace={visibleGroups.value}
                instanceKey={instanceKey.value}
                isMobile={isMobile}
              />
            ),
        }}
      </MasterDetail>
    </div>
  )
})
</script>
