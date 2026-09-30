import { cheConfig } from "@bullyrom/eslint-config"
import { defineConfig, globalIgnores } from "eslint/config"

const config = defineConfig([
  ...cheConfig({ nuxt: false }),
  [globalIgnores(["src/composables/api/testApiSchemaTypes.ts"])],
])
export default config
