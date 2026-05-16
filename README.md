# Портфолио Николая Карпова

[![Deployed via GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-blue?logo=github)](https://nikolai-karpov.github.io)

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
├── cases/                  # HTML-кейсы новой версии
│   ├── carriers-platform.html
│   ├── holding-audit.html
│   ├── pir-s.html
│   ├── pseudonymizer.html
│   ├── rd-prompt-engineering.html
│   └── prototypes/
│       └── yard-booking.html
├── legacy/                 # Старая версия сайта (deprecated)
│   ├── index.html         # Старая главная страница
│   ├── methodology.html   # Старая страница методологии
│   ├── assets/            # Старые CSS, JS, SCSS
│   ├── css/               # Старые стили
│   └── scss/              # Старые SCSS файлы
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
├── site-pages/             # Дополнительные страницы
│   └── case-studies/
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
- Кейсы находятся в [`cases/`](cases/)

### Легаси-версия
- Расположена в папке [`legacy/`](legacy/)
- Сохранена для исторических целей
- Не рекомендуется для использования в новых разработках

---

## 📝 Кейсы

Кейсы проекта находятся в папке [`cases/`](cases/) и включают:

- [`carriers-platform.html`](cases/carriers-platform.html) — Платформа перевозчиков
- [`holding-audit.html`](cases/holding-audit.html) — Аудит холдинга
- [`pir-s.html`](cases/pir-s.html) — ПИР-С
- [`pseudonymizer.html`](cases/pseudonymizer.html) — Псевдонимизатор
- [`rd-prompt-engineering.html`](cases/rd-prompt-engineering.html) — R&D Prompt Engineering

Дополнительные материалы по кейсам находятся в подпапках [`cases/Обзоры/`](cases/Обзоры/) и [`cases/publications/`](cases/publications/).

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
- Сайт: [nikolai-karpov.github.io](https://nikolai-karpov.github.io)

---

**Последнее обновление:** Май 2026