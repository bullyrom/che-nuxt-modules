<script setup lang="ts">
import CheCheckbox from "../../../CheCheckbox.vue"

import type { FieldDescriptor } from "../types"

defineProps<{ field: FieldDescriptor }>()

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <CheCheckbox
    v-model="model"
    class="h-4 w-4 accent-[var(--ch-admin-accent)]"
  />
</template>
