import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [vue()],
  test: {
    exclude: [
      "./src/composables/api/types.test.ts",
      "./src/composables/api/crud-examples.test.ts",
      "node_modules",
    ],
  },
})
