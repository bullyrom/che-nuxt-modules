# che-nuxt-modules

Vue composables and TSX components library.

## OpenAPI admin panel

The OpenAPI-driven admin panel is fully customizable (whole-object field groups,
whole list/detail/header/sidebar overrides, grid, menu tweaks) and can be
embedded outside the admin as separate list/detail/form pieces.

See [docs/admin-customization.md](docs/admin-customization.md).

## Reusable components

Selects (single/multi, with paginated remote option loading), media/file/date
field components and their admin field-API integration are documented in
[docs/components.md](docs/components.md).

## Testing

Behavior-level tests mount the public components (Vue + Pinia + happy-dom) and
cover customization, keyed stores, realtime wiring and the reusable field
components. See [docs/testing.md](docs/testing.md).
