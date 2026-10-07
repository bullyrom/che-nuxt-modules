<template>
  <Dropdown
    :distance="distance"
    :position="position"
    :unmount-on-close="unmountOnClose"
  >
    <slot />
  </Dropdown>
</template>

<script setup lang="ts">
import Dropdown from "./Dropdown.vue"

import type { PropType } from "vue"

defineProps({
  distance: {
    default: 0,
    required: false,
    type: Number,
  },
  position: {
    default: "bottom-start",
    required: false,
    type: String as PropType<
      | "bottom-center"
      | "bottom-end"
      | "bottom-start"
      | "top-center"
      | "top-end"
      | "top-start"
    >,
  },
  unmountOnClose: {
    default: false,
    required: false,
    type: Boolean,
  },
})
</script>
