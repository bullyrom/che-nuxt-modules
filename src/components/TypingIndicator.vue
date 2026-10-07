<template>
  <div class="flex flex-col items-center">
    <svg
      class="h-[70px] w-[70px]"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="26" cy="50" fill="currentColor" r="6">
        <animateTransform
          attributeName="transform"
          begin="0.1s"
          dur="1s"
          repeatCount="indefinite"
          type="translate"
          values="0 15 ; 0 -15; 0 15"
        />
      </circle>

      <circle cx="50" cy="50" fill="currentColor" r="6">
        <animateTransform
          attributeName="transform"
          begin="0.2s"
          dur="1s"
          repeatCount="indefinite"
          type="translate"
          values="0 10 ; 0 -10; 0 10"
        />
      </circle>

      <circle cx="74" cy="50" fill="currentColor" r="6">
        <animateTransform
          attributeName="transform"
          begin="0.3s"
          dur="1s"
          repeatCount="indefinite"
          type="translate"
          values="0 5 ; 0 -5; 0 5"
        />
      </circle>
    </svg>

    <div v-if="message" class="-mt-5 text-sm text-gray-500">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** Optional caption displayed under the animated dots. */
  message?: string
}>()
</script>
