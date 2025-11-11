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

## 🛠 Технологии

- **HTML5** — семантическая разметка
- **CSS3** — кастомные стили, адаптивная верстка
- **Fetch API** — динамическая подгрузка шапки и подвала (`header.html`, `footer.html`)
- **GitHub Pages** — хостинг

> Нет внешних библиотек и фреймворков — только чистый код для максимальной производительности и контроля.

---

## 🗂 Структура проекта


```text
.
├── index.html                      # 🔥 Главная страница сайта (единственный HTML в корне)
├── site-pages/                     # 📄 ВСЕ остальные HTML-страницы сайта
│   ├── contacts.html               # 📞 Страница "Контакты"
│   ├── methodology.html            # 📊 Страница "Методология работы"  
│   ├── results.html                # 🏆 Страница "Результаты и достижения"
│   └── case-studies/               # 📂 Папка с кейсами (отдельный раздел)
│       ├── index.html              # 📋 Главная страница раздела "Кейсы" (обзор всех кейсов)
│       ├── construction.html       # 🏗️ Детальная страница кейса "Строительство"
│       └── procurement.html        # 📦 Детальная страница кейса "Закупки"
├── site-components/                # 🧩 HTML-компоненты для переиспользования
│   ├── header.html                 # 🔝 Шапка сайта (навигация, логотип)
│   └── footer.html                 # 🔚 Подвал сайта (контакты, ссылки)
├── assets/                         # 💎 Все ресурсы сайта (стили, скрипты)
│   ├── css/                        # 🎨 ВСЕ стили проекта
│   │   ├── main.css                # 🧭 Главный сборный файл (ТОЛЬКО импорты)
│   │   ├── base/                   # 🏗️ Базовые/фундаментальные стили
│   │   │   ├── _reset.css          # 🧹 Сброс стилей браузера (обнуление отступов и т.д.)
│   │   │   ├── _variables.css      # 🎯 CSS-переменные (цвета, шрифты, отступы)
│   │   │   ├── _typography.css     # 🔤 Типографика (заголовки, тексты, шрифты)
│   │   │   └── _global.css         # 🌍 Глобальные стили (body, html, общие селекторы)
│   │   ├── components/             # 🧱 Стили КОНКРЕТНЫХ компонентов
│   │   │   ├── _header.css         # 🎪 Стили только для шапки сайта
│   │   │   ├── _footer.css         # 🎪 Стили только для подвала сайта
│   │   │   ├── _buttons.css        # 🔘 Стили всех кнопок на сайте
│   │   │   ├── _cards.css          # 🃏 Стили карточек проектов/кейсов
│   │   │   └── _navigation.css     # 🧭 Стили навигационного меню
│   │   ├── layouts/                # 📐 Стили МАКЕТОВ и раскладок
│   │   │   ├── _grid.css           # 🔲 Сеточные системы и grid-раскладки
│   │   │   ├── _sections.css       # 📦 Стили секций (отступы, фон и т.д.)
│   │   │   └── _containers.css     # 📏 Контейнеры, обёртки, центровщики
│   │   ├── pages/                  # 📄 УНИКАЛЬНЫЕ стили для КОНКРЕТНЫХ страниц
│   │   │   ├── _home.css           # 🏠 Стили ТОЛЬКО для главной страницы
│   │   │   ├── _cases.css          # 📋 Стили ТОЛЬКО для страницы кейсов
│   │   │   ├── _methodology.css    # 📊 Стили ТОЛЬКО для страницы методологии
│   │   │   └── _contacts.css       # 📞 Стили ТОЛЬКО для страницы контактов
│   │   └── utils/                  # 🛠️ Вспомогательные/утилитарные стили
│   │       ├── _helpers.css        # ❓ Вспомогательные классы (скрыть, показать и т.д.)
│   │       └── _animations.css     # ✨ Анимации, переходы, трансформации
│   └── js/                         # ⚡ JavaScript файлы
│       ├── main.js                 # 🧠 Главный JavaScript файл (общая логика)
│       └── components-loader.js    # 🔄 Скрипт загрузки header.html и footer.html
└── images/                         # 🖼️ Все изображения проекта
    ├── logos/                      # 🏷️ Логотипы
    ├── screenshots/                # 📸 Скриншоты проектов
    └── backgrounds/                # 🎨 Фоновые изображения
```
## 📍 Правила именования:

- `_имя.css` - файлы с `_` в начале это ЧАСТИЧНЫЕ файлы (подключаются только через импорт в main.css)
- `site-pages/` - ТОЛЬКО HTML-страницы (кроме главной index.html)
- `site-components/` - ТОЛЬКО HTML-компоненты (header, footer)
- `assets/` - ТОЛЬКО ресурсы (стили, скрипты)
- `images/` - ТОЛЬКО изображения
---

## 🛠 Технологии

- **HTML5** — семантическая разметка
- **CSS3** — модульная архитектура, CSS Custom Properties
- **JavaScript** — динамическая подгрузка компонентов
- **GitHub Pages** — хостинг

---

## 🔧 Модульная система CSS

### Главный файл `assets/css/main.css`:
```css
@import url('base/_reset.css');
@import url('base/_variables.css');
@import url('base/_typography.css');
@import url('base/_global.css');
@import url('components/_header.css');
@import url('components/_footer.css');
@import url('components/_buttons.css');
@import url('components/_cards.css');
@import url('components/_navigation.css');
@import url('layouts/_grid.css');
@import url('layouts/_sections.css');
@import url('layouts/_containers.css');
@import url('pages/_home.css');
@import url('pages/_cases.css');
@import url('pages/_methodology.css');
@import url('pages/_contacts.css');
@import url('utils/_helpers.css');
@import url('utils/_animations.css');
```

---

## 🔗 Подключение в HTML:

```html
<!-- В index.html (корень) -->
<link rel="stylesheet" href="assets/css/main.css">

<!-- В site-pages/*.html -->
<link rel="stylesheet" href="../assets/css/main.css">
```

## 🔄 Загрузка компонентов

Система автоматически определяет пути для загрузки компонентов:

```javascript
function getBasePath() {
  return window.location.pathname.includes('/site-pages/') ? '../' : './';
}

const basePath = getBasePath();

fetch(`${basePath}site-components/header.html`)
  .then(response => response.text())
  .then(data => {
    document.getElementById('header').innerHTML = data;
  });
```

---

## 🌐 Деплой

Сайт доступен по адресу:  
[https://nikolai-karpov.github.io](https://nikolai-karpov.github.io)

---

## 📝 Преимущества структуры

- Уникальные имена папок — нет конфликтов
- Модульность CSS — файлы до 200 строк
- Чистая организация — страницы, компоненты, ресурсы разделены
- Масштабируемость — легко добавлять новые разделы
- Профессиональный стандарт — соответствует best practices

---

## 🤝 Автор

**Николай Карпов**  
[Email](mailto:nikolai@pir-s.ru) | [Telegram](https://t.me/@Nikolai_999)
```
