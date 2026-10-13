import path from "node:path"

import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
  build: {
    lib: {
      entry: {
        // eslint-disable-next-line unicorn/prefer-module
        index: path.resolve(__dirname, "src/index.ts"),
        // composables: path.resolve(dirname, 'src/composables/index.ts'),
        // components: path.resolve(dirname, 'src/components/index.ts')
      },
      // fileName: (format, entryName) =>
      //   `${entryName}.${format === "es" ? "mjs" : "cjs"}`,
      formats: ["es", "cjs"],
    },
    minify: false,
    rollupOptions: {
      external: [
        "vue",
        "vue-router",
        "pinia",
        "openapi-types",
        "nuxt/schema",
        "@vueuse/components",
      ],
      output: {
        exports: "named",
        globals: {
          vue: "Vue",
        },
      },
    },
    sourcemap: true,
    target: "es2022",
  },
  plugins: [
    vue(),
    vueJsx(),
    dts({
      copyDtsFiles: true,
      exclude: ["src/**/*.spec.ts", "src/**/*.test.ts"],
      include: ["src/**/*"],
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      // eslint-disable-next-line unicorn/prefer-module
      "@": path.resolve(__dirname, "src"),
    },
  },
})
