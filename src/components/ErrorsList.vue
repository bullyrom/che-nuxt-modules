<template>
  <ul v-if="errors && errors.length > 0" class="list-inside list-disc text-sm">
    <li v-for="(error, index) in errors" :key="index" class="text-red-500">
      {{ error }}
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  errors?: string[] | undefined
}>()
</script>
