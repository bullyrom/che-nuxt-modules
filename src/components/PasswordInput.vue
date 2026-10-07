<template>
  <div
    class="border pl-3"
    :class="isFocused ? 'border-l-2 border-l-blue-600' : 'border-gray-300'"
  >
    <label class="my-1 block w-full py-2 pl-2">
      <div v-if="title" class="text-sm font-semibold text-gray-500">
        {{ title }}
      </div>

      <div class="flex items-center gap-2">
        <input
          v-model="model"
          :autocomplete="autocomplete"
          class="w-full border-0 p-0 text-base font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none"
          :placeholder="placeholder"
          :type="validType"
          @blur="isFocused = false"
          @focus="isFocused = true"
        />

        <button
          v-if="isPassword"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          class="p-1 text-gray-500 hover:text-gray-700"
          type="button"
          @click="togglePasswordVisibility"
        >
          <svg
            v-if="showPassword"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M3 3l18 18" />

            <path
              d="M10.58 10.58a3 3 0 0 0 4.24 4.24M9.36 5.36A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a17.6 17.6 0 0 1-3.18 4.28M6.6 6.6A17.5 17.5 0 0 0 2 12s3 7 10 7a10.4 10.4 0 0 0 4.64-1.06"
            />
          </svg>

          <svg
            v-else
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />

            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
const properties = defineProps<{
  isPassword?: boolean
  placeholder?: string
  title?: string
  type?: string
}>()

const model = defineModel<string>()
const isFocused = ref(false)
const showPassword = ref(false)

const validType = computed(() =>
  properties.isPassword && !showPassword.value
    ? "password"
    : (properties.type ?? "text"),
)

const autocomplete = computed(() => (properties.isPassword ? "on" : undefined))

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}
</script>
