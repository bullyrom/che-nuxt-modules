import { existsSync } from "node:fs"
import path from "node:path"

const DEFAULT_ENV_FILE = ".env.development"
const ENV_LOADED_FLAG = "PW_TEST_ENV_LOADED"

/**
 * Loads the local e2e environment file once. Existing process variables win,
 * so CI can override any value without editing files. Missing files are fine:
 * the generic defaults in `test/e2e/constants` are used instead.
 */
function loadTestEnvironment(): void {
  if (process.env[ENV_LOADED_FLAG] === "true") return
  const environmentPath = path.resolve(
    process.cwd(),
    process.env.PW_TEST_ENV_FILE ?? DEFAULT_ENV_FILE,
  )
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (existsSync(environmentPath)) process.loadEnvFile(environmentPath)
  process.env[ENV_LOADED_FLAG] = "true"
}

/** Reads a non-empty environment value or falls back to the generic default. */
function readEnvironment(name: string, fallback: string): string {
  const value = process.env[name]
  return value === undefined || value === "" ? fallback : value
}

/** Reads a comma-separated environment list or falls back to the default list. */
function readEnvironmentList(
  name: string,
  fallback: readonly string[],
): string[] {
  return readEnvironment(name, fallback.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/** Escapes a literal string before embedding it into a regular expression. */
function escapeRegExp(value: string): string {
  const specialCharacters = ".*+?^${}()|[]\\"
  return [...value]
    .map((character) =>
      specialCharacters.includes(character) ? `\\${character}` : character,
    )
    .join("")
}

export {
  escapeRegExp,
  loadTestEnvironment,
  readEnvironment,
  readEnvironmentList,
}
