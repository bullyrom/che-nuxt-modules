# Project rules

**Перед началом работы:** если `/projects/ai-rules` отсутствует — склонируй его:
`git clone https://gitea.djue.ru/87anch/ai-rules.git /projects/ai-rules`
Если уже есть — просто читай файлы оттуда.

Перед выполнением любой задачи обязательно читай /projects/ai-rules/general.md, затем /projects/ai-rules/ts.md

Перед работой над фронтендом обязательно читай /projects/ai-rules/frontend-patterns.md, /projects/ai-rules/frontend-che-modules.md и /projects/ai-rules/frontend-forms.md

Все правила из этого файла и всех указанных выше файлов обязательны к строгому соблюдению. Их нарушение недопустимо.

---

## Code exploration

- For ANY codebase exploration task (search, symbols, flow tracing, impact analysis, dependency graphs, context artifacts) — use SocratiCode tools instead of grep/glob/bash.
- Use `socraticode_codebase_status` to verify the index is ready before first use.
- If socraticode is broken or unavailable, report this to the user instead of silently ignoring it or falling back to grep.

---

## Architecture: the future admin package

- The OpenAPI admin panel is planned to be moved into a **separate package** that will depend on `che-nuxt-modules` (the admin consumes this library's modules).
- Design every reusable piece (fields, selects, data/store helpers, API wrappers) as a generic `che-nuxt-modules` export with **no admin-panel-specific coupling**; keep admin-only composition thin and in the admin layer so the split stays cheap.
- Prefer project-agnostic names/props over admin terminology when the piece is general-purpose.

---

## Build

After making any changes, run `yarn build` to verify the build succeeds.

После — закоммить изменение в ветку bullyrom (сообщение на английском, без сборки). Ответь одной строкой: хеш коммита.
