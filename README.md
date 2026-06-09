# Портфолио Николая Карпова

[![Deployed via GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-blue?logo=github)](https://nikolai-pir-s-ru.sourcecraft.site/portfolio)

Простое, но продуманное портфолио, построенное на чистом HTML и CSS, с использованием современных подходов к структуре и поддержке контента. Основная цель — показать методологию работы и реальные кейсы с акцентом на ясность и удобство восприятия.

---

## 🎯 Цель проекта

Представить:
- Философию и методологию работы
- Практические кейсы из профессионального опыта
- Аналитический подход к решению задач

---

## 📁 Структура проекта

```
my-website/
├── index.html              # Главная страница (новая версия)
├── methodology.html        # Страница методологии (новая версия)
├── assets/                 # CSS и JS файлы новой версии
│   ├── css/
│   │   └── style.css      # Основные стили
│   └── js/
│       └── main.js        # Основной JavaScript
├── cases/                  # Исходные материалы кейсов (НЕ HTML-страницы)
│   ├── Кейс_*.md          # Исследовательские заметки по 34 мировым ИИ-кейсам
│   ├── ai-copilot_marketolog/
│   │   └── dashboard.md   # Каноническое руководство для мокапа "Дашборд Маркетолога - Ai-CoPilot"
│   ├── Обзоры/            # Самостоятельные HTML-отчёты-обзоры (research artifact)
│   ├── publications/      # Публикации и материалы
│   └── warehouse_logistic/# Прототип и материалы по складской логистике
├── site-pages/             # Все страницы, доступные с главной (index.html)
│   ├── ai-assistant.html
│   ├── carriers-platform.html
│   ├── contacts.html
│   ├── holding-audit.html
│   ├── hr-n8n-agent.html
│   ├── marketing-insights.html  # Публикационный dashboard page: cockpit AI-CoPilot маркетолога
│   ├── marketing-workbench.html # Публикационный dashboard page: workbench/evidence AI-CoPilot маркетолога
│   ├── pir-s.html
│   ├── prompt_generator.html
│   ├── pseudonymizer.html
│   ├── rd-prompt-engineering.html
│   └── prototypes/
│       └── yard-booking.html # Прототип бронирования окон (используется carriers-platform)
├── legacy/                 # Старая версия сайта (deprecated)
│   ├── index.html         # Старая главная страница
│   ├── assets/            # Старые CSS, JS, SCSS
│   ├── css/               # Старые стили
│   ├── scss/              # Старые SCSS файлы
│   └── site-pages/        # Неактуальные страницы предыдущей версии
│       ├── methodology.html
│       ├── invest_memo.html
│       ├── pirs-strategy*.html
│       ├── results.html
│       ├── report_farma.html
│       └── case-studies/  # Старая структура кейсов (index, construction, procurement, ...)
├── docs/                   # Документация проекта
│   ├── README.md          # Основная документация
│   ├── AGENTS.md          # Документация по агентам
│   ├── CURSOR_COMMANDS.md # Команды Cursor
│   ├── CURSOR_SETUP.md    # Настройка Cursor
│   ├── GIT_CREDENTIAL_MANAGER.md # Менеджер учетных данных Git
│   ├── QUICK_START.md     # Быстрый старт
│   └── for-website-cases.md # Кейсы для сайта
├── scripts/                # Скрипты и утилиты
│   ├── purge.js           # Скрипт очистки CSS
│   ├── test_fetch.js      # Тестирование fetch
│   └── patch-alt-snapshots.mjs
├── curs/                   # Курс
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── data/
├── present_course/         # Презентационный курс
│   ├── main.html
│   ├── slides/
│   └── assets/
├── archive/                # Архивные файлы
├── downloads/              # Загрузки
├── images/                 # Изображения
├── site-components/        # Компоненты сайта
│   ├── header.html
│   └── footer.html
├── alt/                    # Исходная папка (игнорируется git)
├── package.json            # Зависимости проекта
├── package-lock.json       # Блокировка зависимостей
├── .gitignore              # Игнорируемые файлы
├── .stylelintrc.json       # Конфигурация Stylelint
└── .husky/                 # Git hooks
```

---

## 🛠 Технологии

- **HTML5** — семантическая разметка
- **CSS3** — кастомные стили, адаптивная верстка
- **JavaScript (ES6+)** — интерактивность
- **GitHub Pages** — хостинг

> Нет внешних библиотек и фреймворков — только чистый код для максимальной производительности и контроля.

---

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск локального сервера

```bash
# Если установлен live-server
npx live-server

# Или используйте любой другой локальный сервер
python -m http.server 8000
```

### Сборка проекта (для легаси-версии)

```bash
npm run build
```

---

## 📚 Документация

Подробная документация доступна в папке [`docs/`](docs/):

- [`README.md`](docs/README.md) — полная документация проекта
- [`AGENTS.md`](docs/AGENTS.md) — документация по агентам
- [`CURSOR_COMMANDS.md`](docs/CURSOR_COMMANDS.md) — команды Cursor
- [`CURSOR_SETUP.md`](docs/CURSOR_SETUP.md) — настройка Cursor
- [`GIT_CREDENTIAL_MANAGER.md`](docs/GIT_CREDENTIAL_MANAGER.md) — менеджер учетных данных Git
- [`QUICK_START.md`](docs/QUICK_START.md) — быстрый старт
- [`for-website-cases.md`](docs/for-website-cases.md) — кейсы для сайта

---

## 🔄 Версии проекта

### Текущая версия (v2)
- Расположена в корне проекта
- Включает [`index.html`](index.html), [`methodology.html`](methodology.html)
- Использует папку [`assets/`](assets/) для стилей и скриптов
- Все страницы, доступные с главной, лежат в [`site-pages/`](site-pages/)
- Папка [`cases/`](cases/) — только для исходных материалов (markdown-исследования, обзоры, прототипы); HTML-страниц в ней быть не должно

### Легаси-версия
- Расположена в папке [`legacy/`](legacy/)
- Сохранена для исторических целей
- Не рекомендуется для использования в новых разработках

---

## 📝 Кейсы

HTML-страницы кейсов лежат в [`site-pages/`](site-pages/) (все они доступны с главной [`index.html`](index.html)):

- [`ai-assistant.html`](site-pages/ai-assistant.html) — Персональный ИИ-ассистент руководителя
- [`carriers-platform.html`](site-pages/carriers-platform.html) — Платформа перевозчиков
- [`holding-audit.html`](site-pages/holding-audit.html) — Аудит холдинга
- [`pir-s.html`](site-pages/pir-s.html) — ПИР-Система
- [`pseudonymizer.html`](site-pages/pseudonymizer.html) — Pseudonymizer MVP
- [`rd-prompt-engineering.html`](site-pages/rd-prompt-engineering.html) — Промпт-инжиниринг для R&D
- [`hr-n8n-agent.html`](site-pages/hr-n8n-agent.html) — HR-агент на n8n
- [`prompt_generator.html`](site-pages/prompt_generator.html) — Генератор стратегий продаж
- [`contacts.html`](site-pages/contacts.html) — Полная форма заявки

Публикационные dashboard pages для AI-CoPilot маркетолога:

- [`marketing-insights.html`](site-pages/marketing-insights.html) — управленческий cockpit регулярного маркетингового отчёта
- [`marketing-workbench.html`](site-pages/marketing-workbench.html) — рабочий стол доказательств, запросов, креативов и ручного подтверждения

Исходные материалы и заметки по кейсам — в [`cases/`](cases/) (markdown-исследования, обзоры в [`cases/Обзоры/`](cases/Обзоры/), публикации в [`cases/publications/`](cases/publications/)). **В папке `cases/` не должно быть HTML-страниц сайта** — они принадлежат `site-pages/`.

Для мокапа [`Дашборд Маркетолога - Ai-CoPilot`](cases/ai-copilot_marketolog/dashboard.md) каноническим reference-файлом считается [`cases/ai-copilot_marketolog/dashboard.md`](cases/ai-copilot_marketolog/dashboard.md): он задаёт вопрос, на который должен отвечать интерфейс, и структуру управленческого дашборда.

---

## 🎨 Стилизация

### Текущая версия
- CSS файлы находятся в [`assets/css/`](assets/css/)
- Основной файл: [`assets/css/style.css`](assets/css/style.css)
- JavaScript в [`assets/js/main.js`](assets/js/main.js)

### Легаси-версия
- SCSS файлы в [`legacy/assets/scss/`](legacy/assets/scss/)
- Скомпилированный CSS в [`legacy/assets/css/`](legacy/assets/css/)
- Методология 7-1 Pattern для организации стилей

---

## 🔧 Скрипты

Доступные npm-скрипты (для легаси-версии):

```bash
npm run build          # Сборка проекта
npm run sass:build     # Компиляция SCSS
npm run purge:css      # Очистка CSS
npm run lint:css       # Проверка стилей
npm run lint:css:fix   # Автоисправление стилей
```

---

## 📦 Зависимости

Основные зависимости:
- `sass` — препроцессор для стилей
- `stylelint` — линтинг CSS/SCSS
- `husky` — Git hooks
- `lint-staged` — линтинг при коммите

---

## 🤝 Вклад

Проект находится в активной разработке. Для внесения изменений:

1. Создайте ветку
2. Внесите изменения
3. Создайте pull request

---

## 📄 Лицензия

Проект является портфолио и предназначен для демонстрации навыков и опыта.

---

## 📞 Контакты

- GitHub: [@nikolai-karpov](https://github.com/nikolai-karpov)
- Сайт: [nikolai-pir-s-ru.sourcecraft.site/portfolio](https://nikolai-pir-s-ru.sourcecraft.site/portfolio)

---

**Последнее обновление:** Май 2026 — реструктуризация: HTML-кейсы перенесены из `cases/` в `site-pages/`, неактуальные страницы предыдущей версии переведены в `legacy/site-pages/`.
