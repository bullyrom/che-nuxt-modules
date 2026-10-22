# che-nuxt-modules

Vue composables and TSX components library.

## OpenAPI admin panel

The OpenAPI-driven admin panel is fully customizable (whole-object field groups,
whole list/detail/header/sidebar overrides, grid, menu tweaks) and can be
embedded outside the admin as separate list/detail/form pieces.

See [docs/admin-customization.md](docs/admin-customization.md).

## Базовая настройка админки

Сначала настройте критичные поля: файлы (multipart), FK-селекты, M2M-мультиселекты и enum/choices — без них форма не сохраняется или отправляет невалидные значения. Даты, медиа-отображение, длинный текст и числовые ограничения — UX-улучшения второго шага. База — селекты/мультиселекты + файлы.

Приоритеты, каталог готовых компонентов и пример `AdminPanelConfig`:
[docs/admin-fields.md](docs/admin-fields.md). Полный справочник props:
[docs/components.md](docs/components.md).

## Reusable components

Selects (single/multi, with paginated remote option loading), media/file/date
field components and their admin field-API integration are documented in
[docs/components.md](docs/components.md).

## Testing

External Playwright e2e tests drive the running admin frontend through the
shared remote Chromium browser (no local browser). See
[docs/testing.md](docs/testing.md).
