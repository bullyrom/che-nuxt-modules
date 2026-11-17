import { describe, expect, it } from "vitest"

import {
  buildAdminThemeStyle,
  resolveAdminTheme,
  useAdminTheme,
} from "./theme"

describe("admin theme", () => {
  it("resolves explicit light and dark themes", () => {
    expect(resolveAdminTheme("light")).toBe("light")
    expect(resolveAdminTheme("dark")).toBe("dark")
    expect(resolveAdminTheme(undefined)).toBe("dark")
  })

  it("exposes the variables for both themes", () => {
    const light = buildAdminThemeStyle("light")
    const dark = buildAdminThemeStyle("dark")

    expect(light["--ch-admin-surface"]).not.toBe(dark["--ch-admin-surface"])
    expect(light["--ch-admin-text"]).not.toBe(dark["--ch-admin-text"])
  })

  it("reacts to a config theme getter", () => {
    const { theme, themeStyle } = useAdminTheme(() => "light")

    expect(theme.value).toBe("light")
    expect(themeStyle.value["--ch-admin-surface"]).toBe("#ffffff")
  })
})
