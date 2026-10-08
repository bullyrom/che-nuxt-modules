<script setup lang="ts">
interface Properties {
  value: unknown
}
defineProps<Properties>()

defineOptions({ name: "FieldValue" })

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
</script>

<template>
  <template v-if="value === null || value === undefined">
    <span class="text-[var(--ch-admin-text-muted)]">—</span>
  </template>
  <template v-else-if="typeof value === 'boolean'">
    <span
      class="inline-flex rounded-[var(--ch-admin-radius-sm)] px-1.5 py-0.5 text-xs font-medium"
      :class="
        value
          ? 'bg-[var(--ch-admin-success-bg)] text-[var(--ch-admin-success-text)]'
          : 'bg-[var(--ch-admin-danger-bg)] text-[var(--ch-admin-danger-text)]'
      "
    >
      {{ value ? "Yes" : "No" }}
    </span>
  </template>
  <template v-else-if="typeof value === 'number'">
    <span class="font-mono text-sm text-[var(--ch-admin-text-muted)]">
      {{ value.toLocaleString() }}
    </span>
  </template>
  <template v-else-if="typeof value === 'string'">
    <span class="text-sm text-[var(--ch-admin-text)]">{{ value }}</span>
  </template>
  <template v-else-if="Array.isArray(value)">
    <div class="space-y-1">
      <div v-for="(el, i) in value" :key="i" class="ml-3">
        <FieldValue :value="el" />
      </div>
    </div>
  </template>
  <template v-else-if="isObject(value)">
    <div
      class="ml-3 space-y-1 rounded-[var(--ch-admin-radius-sm)] border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)] p-2"
    >
      <div v-for="(v, k) in value" :key="k" class="flex items-start gap-2">
        <span
          class="mt-0.5 shrink-0 font-mono text-xs text-[var(--ch-admin-text-muted)]"
        >
          {{ k }}:
        </span>
        <FieldValue :value="v" />
      </div>
    </div>
  </template>
  <template v-else>
    <span class="text-sm text-[var(--ch-admin-text-muted)]">{{
      String(value)
    }}</span>
  </template>
</template>
