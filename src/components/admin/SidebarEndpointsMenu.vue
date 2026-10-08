<script setup lang="tsx">
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import type { ParsedEntity } from "../../stores/adminPanel/types"

const adminPanelStore = useAdminPanelStore()

interface Properties {
  filteredEntitiesByNamespace: {
    entities: ParsedEntity[]
    namespace: string
  }[]
  isMobile?: boolean
}

const properties = defineProps<Properties>()
</script>

<template>
  <div
    class="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)]"
    :class="properties.isMobile ? 'w-full' : 'w-64'"
  >
    <div class="border-b border-[var(--ch-admin-border)] px-4 py-3">
      <h2
        class="text-sm font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
      >
        Endpoints
      </h2>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div
        v-for="group in properties.filteredEntitiesByNamespace"
        :key="group.namespace"
      >
        <div
          class="px-4 py-2 text-xs font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
        >
          {{ group.namespace || "No namespace" }}
        </div>

        <div>
          <button
            v-for="entity in group.entities"
            :key="entity.entityName"
            class="block w-full border-b border-[var(--ch-admin-border)] px-4 py-2.5 text-left text-sm text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
            :class="{
              'bg-[var(--ch-admin-surface-hover)] font-medium text-[var(--ch-admin-text)]':
                adminPanelStore.activeEntity?.entityName ===
                  entity.entityName &&
                adminPanelStore.activeEntity?.namespace === entity.namespace,
            }"
            @click="adminPanelStore.activeEntity = entity"
          >
            {{ entity.entityName }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
