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

## Build

After making any changes, run `yarn build` to verify the build succeeds.

После — закоммить изменение в ветку bullyrom (сообщение на английском, без сборки). Ответь одной строкой: хеш коммита.
