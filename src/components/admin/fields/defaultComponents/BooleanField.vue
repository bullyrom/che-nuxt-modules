<script setup lang="ts">
import CheCheckbox from "../../../CheCheckbox.vue"

import type { FieldDescriptor } from "../types"

defineProps<{ field: FieldDescriptor }>()

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <CheCheckbox v-model="model" />
</template>
