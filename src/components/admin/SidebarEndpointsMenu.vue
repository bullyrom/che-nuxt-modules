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
    :class="properties.isMobile ? 'w-full' : 'w-64 shrink-0'"
  >
    <div class="border-b border-[var(--ch-admin-border)] px-4 py-3">
      <h2
        class="text-sm font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
      >
        Endpoints
      </h2>
    </div>

    <div class="flex-1 space-y-5 overflow-y-auto p-3">
      <section
        v-for="group in properties.filteredEntitiesByNamespace"
        :key="group.namespace"
      >
        <h3
          class="mb-2 px-2 text-xs font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
        >
          {{ group.namespace || "No namespace" }}
        </h3>

        <ul class="space-y-1">
          <li v-for="entity in group.entities" :key="entity.entityName">
            <button
              class="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors"
              :class="
                adminPanelStore.activeEntity?.entityName ===
                  entity.entityName &&
                adminPanelStore.activeEntity?.namespace === entity.namespace
                  ? 'bg-[var(--ch-admin-accent)] font-medium text-white'
                  : 'text-[var(--ch-admin-text)] hover:bg-[var(--ch-admin-surface-hover)]'
              "
              type="button"
              @click="adminPanelStore.activeEntity = entity"
            >
              <span class="truncate">{{ entity.entityName }}</span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
