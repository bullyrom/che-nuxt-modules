import { unref } from "vue"

import type { MaybeRef } from "vue"

/**
 * Default visual theme for the OpenAPI admin panel.
 *
 * The palette follows the `notes` frontend style. Colors are library defaults
 * (not part of the runtime config yet) and are exposed to the admin components
 * through CSS custom properties set on the admin root element, so the whole
 * subtree can switch between dark and light instantly.
 */

type AdminPanelTheme = "dark" | "light"

/**
 * Reactive source for the admin theme. Accepts a plain value, a ref/computed
 * or a getter so the host app can pass its color mode without the library
 * depending on `@nuxtjs/color-mode`.
 */
type AdminPanelThemeSource =
  | (() => AdminPanelTheme)
  | MaybeRef<AdminPanelTheme>

const DEFAULT_ADMIN_PANEL_THEME: AdminPanelTheme = "dark"

const DARK_THEME_VARIABLES: Record<string, string> = {
  "--ch-admin-accent": "#3b5cf6",
  "--ch-admin-accent-hover": "#4d6bff",
  "--ch-admin-bg": "#161616",
  "--ch-admin-border": "rgba(255, 255, 255, 0.1)",
  "--ch-admin-danger-bg": "rgba(239, 68, 68, 0.15)",
  "--ch-admin-danger-text": "#f87171",
  "--ch-admin-info-bg": "rgba(59, 92, 246, 0.15)",
  "--ch-admin-info-text": "#818cf8",
  "--ch-admin-overlay": "rgba(0, 0, 0, 0.6)",
  "--ch-admin-success-bg": "rgba(34, 197, 94, 0.15)",
  "--ch-admin-success-text": "#4ade80",
  "--ch-admin-surface": "#242424",
  "--ch-admin-surface-hover": "#2e2e2e",
  "--ch-admin-text": "#fafafa",
  "--ch-admin-text-muted": "#aeaeae",
  "--ch-admin-warning-bg": "rgba(234, 179, 8, 0.15)",
  "--ch-admin-warning-text": "#facc15",
}

const LIGHT_THEME_VARIABLES: Record<string, string> = {
  "--ch-admin-accent": "#3b5cf6",
  "--ch-admin-accent-hover": "#2f4de0",
  "--ch-admin-bg": "#fafafa",
  "--ch-admin-border": "rgba(0, 0, 0, 0.1)",
  "--ch-admin-danger-bg": "#fee2e2",
  "--ch-admin-danger-text": "#b91c1c",
  "--ch-admin-info-bg": "#e0e7ff",
  "--ch-admin-info-text": "#4338ca",
  "--ch-admin-overlay": "rgba(0, 0, 0, 0.3)",
  "--ch-admin-success-bg": "#dcfce7",
  "--ch-admin-success-text": "#15803d",
  "--ch-admin-surface": "#ffffff",
  "--ch-admin-surface-hover": "#f1f1f2",
  "--ch-admin-text": "#161616",
  "--ch-admin-text-muted": "#6b6b6b",
  "--ch-admin-warning-bg": "#fef3c7",
  "--ch-admin-warning-text": "#b45309",
}

const THEME_VARIABLES: Record<AdminPanelTheme, Record<string, string>> = {
  dark: DARK_THEME_VARIABLES,
  light: LIGHT_THEME_VARIABLES,
}

/**
 * Resolves a theme source reactively. Unknown values (e.g. `"system"`) fall
 * back to the library default so the admin is always fully themed.
 */
function resolveAdminTheme(
  source: AdminPanelThemeSource | undefined,
): AdminPanelTheme {
  if (source === undefined) return DEFAULT_ADMIN_PANEL_THEME
  const value = typeof source === "function" ? source() : unref(source)
  return value === "light" ? "light" : DEFAULT_ADMIN_PANEL_THEME
}

/** Resolves the CSS custom properties for the requested admin theme. */
function buildAdminThemeStyle(theme: AdminPanelTheme): Record<string, string> {
  return THEME_VARIABLES[theme]
}

export {
  type AdminPanelTheme,
  type AdminPanelThemeSource,
  buildAdminThemeStyle,
  DEFAULT_ADMIN_PANEL_THEME,
  resolveAdminTheme,
}
