<template>
  <div
    class="flex rounded-sm border p-0"
    :class="isFocused ? 'ring ring-blue-300' : 'border-gray-300'"
    @click="focusInput"
  >
    <div class="flex-1">
      <input
        :id="id"
        ref="inputReference"
        v-model="model"
        class="w-full [appearance:textfield] rounded-l-sm border-0 py-1.5 pr-2 pl-2 text-sm focus:ring-0 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        :placeholder="placeholder"
        type="number"
        @blur="isFocused = false"
        @focus="isFocused = true"
        @input="onInput"
      />
    </div>

    <div
      class="flex cursor-text flex-col justify-center rounded-r-sm pr-2 text-right text-sm text-gray-600"
    >
      {{ units }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id?: string
  placeholder?: string
  /** Unit suffix displayed on the right (e.g. `"°C"`). */
  units: string
}>()

const emit = defineEmits<(emit: "input", value: number | string) => void>()

const model = defineModel<number | string>()
const isFocused = ref(false)
const inputReference = ref<HTMLInputElement>()

function focusInput() {
  inputReference.value?.focus()
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit("input", target.value)
}
</script>
