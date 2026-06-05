# ТЗ для программиста — форма заявки (Formspree) + цели Метрики

**Проект:** my-website (статика, GitHub Pages, без бэкенда)
**Счётчик Яндекс.Метрики:** `109350250`
**Дата:** 2026-06-05
**Связанное ТЗ:** [TZ-marketolog-formspree.md](TZ-marketolog-formspree.md)

---

## 0. Вводные по проекту

- Сайт статический, сборка SCSS → CSS (`npm run build`), PurgeCSS. Стили: `assets/scss/`.
- JS: `assets/js/main.js` подключается с `defer` в конце `<body>`.
- Уже есть механизм целей через делегирование (НЕ дублировать):
  `assets/js/main.js:97-104` — клик по `[data-goal]` шлёт `ym(109350250,'reachGoal', <goal>)`.
- Endpoint Formspree `https://formspree.io/f/xdavaknw`

---

## Задача 1. Разметка формы заявки

Вставить форму в секцию `#contact`:
- **index.html** — заменить блок-обманку `index.html:692-697` (кнопка «Полная форма заявки»). Форму разместить над блоком `.channels` (`index.html:660-690`); каналы Email/Telegram/MAX оставить как альтернативу.
- **site-pages/contacts.html** — вставить ту же форму над блоком `.channels` (`contacts.html:124`).

Разметка (на contacts.html в `action` подставить относительный путь не нужно — endpoint абсолютный):

```html
<form id="leadForm" class="lead-form" action="https://formspree.io/f/xdavaknw" method="POST">
  <div class="lead-form__row">
    <label for="lf-name">Имя</label>
    <input id="lf-name" name="name" type="text" required autocomplete="name"
           placeholder="Как к вам обращаться">
  </div>
  <div class="lead-form__row">
    <label for="lf-contact">Email или Telegram</label>
    <input id="lf-contact" name="contact" type="text" required
           placeholder="i@example.com или @username">
  </div>
  <div class="lead-form__row">
    <label for="lf-task">Задача (необязательно)</label>
    <textarea id="lf-task" name="task" rows="4"
              placeholder="Коротко о бизнес-боли"></textarea>
  </div>

  <!-- honeypot против ботов: скрыть в CSS, Formspree игнорирует заполненное _gotcha -->
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"
         class="lead-form__hp" aria-hidden="true">

  <!-- тема письма в Formspree -->
  <input type="hidden" name="_subject" value="Заявка с сайта Портфолио">

  <button type="submit" class="btn btn--gradient">
    Отправить заявку <span class="btn__arrow" aria-hidden="true">→</span>
  </button>
  <p class="lead-form__status" role="status" aria-live="polite"></p>
</form>
```

Требования:
- Браузерная валидация (`required`, `type`).
- Кнопку «Полная форма заявки» на index.html заменить на якорь `href="#contact"`.

---

## Задача 2. Стили формы

Добавить в `assets/scss/` (через существующую структуру компонентов), пересобрать `npm run build`:
- Адаптив (моб./десктоп), отступы в стиле `.channels`.
- Поддержка тёмной темы — цвета через существующие CSS-переменные темы (фон, бордеры, текст, placeholder).
- Honeypot скрыть:
  ```scss
  .lead-form__hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
  ```
- Состояния: `:focus` для полей, `:disabled` для кнопки во время отправки, видимый текст `.lead-form__status`.

---

## Задача 3. JS-отправка + событие конверсии Метрики

Добавить в `assets/js/main.js` (НЕ внутрь существующего делегатора кликов — это отдельный обработчик `submit`). Цель `form_submit` шлётся **только при успешном ответе Formspree**, а не по клику:

```javascript
// Lead form submit (Formspree) + Yandex Metrika goal
const leadForm = document.getElementById('leadForm');
if (leadForm) {
  const statusEl = leadForm.querySelector('.lead-form__status');
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = leadForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    if (statusEl) statusEl.textContent = 'Отправляем…';

    try {
      const res = await fetch(leadForm.action, {
        method: 'POST',
        body: new FormData(leadForm),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        // ✅ КОНВЕРСИЯ: цель в Яндекс.Метрику
        if (typeof window.ym === 'function') {
          window.ym(109350250, 'reachGoal', 'form_submit');
        }
        if (statusEl) statusEl.textContent = 'Заявка отправлена. Отвечу в течение 4 часов.';
        leadForm.reset();
      } else {
        if (statusEl) {
          statusEl.textContent = 'Не удалось отправить. Напишите в Telegram или на email.';
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'Ошибка сети. Напишите в Telegram или на email.';
      }
    } finally {
      btn.disabled = false;
    }
  });
}
```

> Это и есть «JavaScript-событие», под которое маркетолог создаёт цель `form_submit`
> в Метрике (тип цели — JavaScript-событие, идентификатор `form_submit`).

---

## Задача 4. Разметка открытия кейсов (`view_case_*`)

Доп. JS НЕ нужен — делегатор `main.js:97-104` подхватит. Добавить атрибут `data-goal`
к ссылкам кейсов в **index.html**:

| Кейс (href) | Строка | Добавить атрибут |
|-------------|--------|------------------|
| site-pages/pir-s.html | `index.html:290` | `data-goal="view_case_pir_s"` |
| site-pages/pseudonymizer.html | `index.html:323` | `data-goal="view_case_pseudonymizer"` |
| site-pages/holding-audit.html | `index.html:358` | `data-goal="view_case_holding_audit"` |
| site-pages/ai-assistant.html | `index.html:399` | `data-goal="view_case_ai_assistant"` |
| site-pages/hr-n8n-agent.html | `index.html:433` | `data-goal="view_case_hr_n8n_agent"` |
| site-pages/vector-store-engineering-memory.html | `index.html:453` | `data-goal="view_case_vector_store"` |
| site-pages/rd-prompt-engineering.html | `index.html:459` | `data-goal="view_case_rd_prompt"` |
| site-pages/carriers-platform.html | `index.html:465` | `data-goal="view_case_carriers"` |
| site-pages/prompt_generator.html | `index.html:471` | `data-goal="view_case_prompt_generator"` |
| site-pages/publications/index.html (курс) | `index.html:477` | `data-goal="view_case_course"` |

> Проверить номера строк перед правкой — могли сместиться. Ориентир: классы
> `.case-featured__link` (featured) и `.case-row` (остальные).

---

## Задача 5. Проверка

- [ ] PurgeCSS не вырезал классы формы (`.lead-form*`) — проверить whitelist/safelist в `purge.js`, при необходимости добавить.
- [ ] Тестовая отправка → 200 OK от Formspree, письмо пришло.
- [ ] В консоли при успехе вызывается `ym(109350250,'reachGoal','form_submit')` (проверить в Метрика → Конверсии или через расширение).
- [ ] Форма корректна в светлой и тёмной теме, на мобильном.
- [ ] Клики по 10 ссылкам кейсов шлют `view_case_*` (вкладка Network → запросы на mc.yandex.ru).
- [ ] Кнопка «Полная форма заявки» больше не ведёт в пустоту.

---

## Файлы, которые меняем

| Файл | Что делаем |
|------|-----------|
| `index.html` | форма в `#contact`, убрать кнопку-обманку, `data-goal` на 10 кейсов |
| `site-pages/contacts.html` | форма над `.channels` |
| `assets/js/main.js` | обработчик `submit` + `reachGoal('form_submit')` |
| `assets/scss/...` | стили `.lead-form`, пересборка `npm run build` |
| `purge.js` (если нужно) | safelist для классов формы |
