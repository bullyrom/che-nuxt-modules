<template>
  <div v-if="errors && Object.keys(errors).length > 0" class="text-sm">
    <div v-for="(messages, key) in errors" :key="key" class="mt-1">
      <p
        v-for="(message, index) in messages"
        :key="index"
        class="text-[var(--ch-admin-danger-text)]"
      >
        {{ key === "non_field_errors" ? message : `${key}: ${message}` }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  errors?: Record<string, string[] | undefined> | undefined
}>()
</script>
