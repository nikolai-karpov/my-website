# 🐛 Bug Report: News Pipeline — три критических разрыва

**Дата:** 2026-05-26
**Обнаружено при:** ручной запуск cron `daily-news-pipeline` (883d37ee35b9)
**Серьёзность:** HIGH — пайплайн отчитывается об успехе, но результат нигде не виден конечному читателю

---

## Суть проблемы

News pipeline (6 шагов) завершается с exit code 0 и пишет `pipeline_done: успех`, но **ни один из трёх каналов публикации не получает контент**. Пайплайн складывает файлы «в стол».

---

## Разрыв 1: Статический сайт — файлы пушатся, но не обслуживаются

### Что происходит
- **Publisher** (шаг 5) копирует HTML из `~/.hermes/news-pipeline/04-rendered/{date}/news/` в `~/projects/my-website/site-pages/news/`
- Делает `git add + commit + push` в репо `nikolai-karpov/my-website`, ветка `main`
- Commit создаётся корректно (например, `29d4fd9` — «news: 2026-05-26 — 10 выпусков»)
- Файлы физически лежат в репо: `site-pages/news/2026-05-26-*/index.html`

### Что сломано
- **GitHub Pages не настроен** для этого репо:
  - Нет `.github/workflows/` — нет CI/CD
  - Нет ветки `gh-pages`
  - URL `nikolai-karpov.github.io/my-website/site-pages/news/index.html` → **404**
- SourceCraft также не подключён (нет `.sourcecraft/` в репо)
- Файлы — мёртвый груз в git-репо

### Доказательство
```
$ curl -s -o /dev/null -w "%{http_code}" \
  "https://nikolai-karpov.github.io/my-website/site-pages/news/index.html"
404

$ ls ~/projects/my-website/.github/
NO .github DIR

$ git -C ~/projects/my-website branch -a | grep -i pages
(пусто)
```

### Код, ответственный за пуш
Файл: `~/.hermes/scripts/news_publisher.py`
```python
DEFAULT_TARGET_REPO = HOME / "projects" / "my-website"
SITE_NEWS_SUBPATH = Path("site-pages") / "news"
```
Пушит в `main`, но нигде не проверяет, что GitHub Pages активен или что файлы доступны по URL.

### Manifest (publisher считает это успехом)
Файл: `~/.hermes/news-pipeline/05-published/2026-05-26.json`
```json
{
  "pushed": true,
  "urls": [
    "https://nikolai-karpov.github.io/my-website/site-pages/news/2026-05-26-dobavili-novuiu-model-gemini-3-5-flash/"
  ]
}
```
URL указан, но он 404.

---

## Разрыв 2: Notifier — Telegram-канал заглушка

### Что происходит
- **Notifier** (шаг 6) читает `05-published/{date}.json`, формирует текст сводки
- Вызывает `TelegramChannelNotifier.send()`

### Что сломано
- `TelegramChannelNotifier` — **заглушка** с `NotImplementedError`:
```python
# ~/.hermes/scripts/news_notifier.py:266-281
class TelegramChannelNotifier(Notifier):
    name = "telegram"
    def send(self, payload, *, dry_run=False):
        if dry_run:
            return NotifyResult(channel=self.name, ok=True, detail="stub dry-run")
        raise NotImplementedError(
            "TelegramChannelNotifier пока не реализован — добавь при появлении канала."
        )
```
- По умолчанию `DEFAULT_CHANNELS = ("max",)` — Telegram даже не вызывается
- Канал `@ai_news_nik` существует, бот `@hermes9_ai_bot` есть, токен `TELEGRAM_BOT_TOKEN` в `.env` — но notifier их не использует

---

## Разрыв 3: Notifier — VK заглушка

### Что происходит
- `VK` вообще не реализован как класс — нет даже заглушки в `news_notifier.py`
- Группа `vk.com/club239071178` существует, `VK_ACCESS_TOKEN` (group token) есть в `.env`
- Но notifier не знает о VK как о канале

---

## Как «успех» определяется сейчас (и почему это неправильно)

### Publisher считает успехом:
1. `git commit` вернул exit code 0
2. `git push` вернул exit code 0
3. Манифест записан в `05-published/`

**Проблема:** ни одна из этих проверок не подтверждает, что контент **доступен читателю**.

### Notifier считает успехом:
1. MAX API вернул HTTP 200 (сообщение в личный чат с владельцем)
2. Telegram/VK — либо не вызываются, либо заглушки

**Проблема:** «успех» = одно сообщение в личку владельцу. Это не публикация в канал.

---

## Предлагаемое определение «успех»

Пайплайн считается успешно завершённым, только если:

1. **Сайт:** контент доступен по URL (HTTP 200), а не просто «закоммичен»
2. **Telegram:** сообщение/пост появился в `@ai_news_nik` (API вернул `message_id`)
3. **VK:** пост появился в группе `club239071178` (API вернул `post_id`)
4. **Notifier:** сводка отправлена во все настроенные каналы (не только в личный чат)

Минимум для «успеха» — хотя бы один публичный канал (TG или VK) + сайт.

---

## Артефакты для воспроизведения

| Файл | Описание |
|---|---|
| `~/.hermes/news-pipeline/logs/2026-05-26.log` | Лог оркестратора |
| `~/.hermes/news-pipeline/05-published/2026-05-26.json` | Манифест (pushed=true, но 404) |
| `~/.hermes/news-pipeline/logs/2026-05-26-notify.json` | Notifier result (только MAX) |
| `~/.hermes/cron/output/883d37ee35b9/2026-05-26_14-35-14.md` | Cron output |
| `~/.hermes/scripts/news_publisher.py` | Код publisher (строка 50: DEFAULT_TARGET_REPO) |
| `~/.hermes/scripts/news_notifier.py` | Код notifier (строка 266: Telegram stub) |

---

## Шаги для исправления

1. **Настроить GitHub Pages** для `nikolai-karpov/my-website` (или выбрать другой хостинг)
2. **Реализовать TelegramChannelNotifier** — sendMessage через Bot API в `@ai_news_nik`
3. **Реализовать VK notifier** — wall.post через VK API в группу
4. **Добавить health-check** в publisher — после push проверить HTTP 200 по URL
5. **Изменить критерий успеха** — pipeline_done только если хотя бы один публичный канал подтвердил публикацию
