import { fileURLToPath } from "node:url"

import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // `vue-router` is a peer dependency (provided by Nuxt at runtime), so the
      // unit tests resolve it to a minimal stub.
      "vue-router": fileURLToPath(
        new URL("test/vue-router.ts", import.meta.url),
      ),
    },
  },
  test: {
    exclude: [
      "./src/composables/api/types.test.ts",
      "./src/composables/api/crud-examples.test.ts",
      "./test/e2e/**",
      "node_modules",
    ],
  },
})
