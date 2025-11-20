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
- **SCSS** — модульная архитектура, переменные, вложенность
- **Sass (Dart Sass)** — компиляция SCSS → CSS
- **PurgeCSS** — удаление неиспользуемых стилей
- **Stylelint** — проверка качества CSS/SCSS
- **Live Server + Concurrently** — автообновление при разработке
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
│       ├── index.html              # 📂 Главная страница раздела "Кейсы"
│       ├── construction.html       # 🏗️ Детальная страница кейса "Строительство"
│       └── procurement.html        # 📦 Детальная страница кейса "Закупки"
├── site-components/                # 🧩 HTML-компоненты для переиспользования
│   ├── header.html                 # 🔝 Шапка сайта (навигация, логотип)
│   └── footer.html                 # 🔚 Подвал сайта (контакты, ссылки)
├── assets/                         # 💎 Все ресурсы сайта (стили, скрипты)
│   ├── css/                        # 🎨 ВСЕ стили проекта
│   │   ├── main.css                # 🧭 Главный сборный файл (результат компиляции)
│   │   ├── main.css.map            # 🗺️ Карта стилей для отладки
│   ├── scss/                        # 🎨 исходники для компиляции
│   │   ├── main.scss                # 🧭 Главный сборный файл (ТОЛЬКО импорты)
│   │   ├── base/                   # 🏗️ Базовые/фундаментальные стили
│   │   │   ├── _reset.scss          # 🧹 Сброс стилей браузера (обнуление отступов и т.д.)
│   │   │   ├── _variables.scss      # 🎯 CSS-переменные (цвета, шрифты, отступы)
│   │   │   ├── _typography.scss     # 🔤 Типографика (заголовки, тексты, шрифты)
│   │   │   └── _global.scss         # 🌍 Глобальные стили (body, html, общие селекторы)
│   │   ├── components/             # 🧱 Стили КОНКРЕТНЫХ компонентов
│   │   │   ├── _header.scss         # 🎪 Стили только для шапки сайта
│   │   │   ├── _footer.scss         # 🎪 Стили только для подвала сайта
│   │   │   ├── _buttons.scss        # 🔘 Стили всех кнопок на сайте
│   │   │   ├── _cards.scss          # 🃏 Стили карточек проектов/кейсов
│   │   │   └── _navigation.scss     # 🧭 Стили навигационного меню
│   │   ├── layouts/                # 📐 Стили МАКЕТОВ и раскладок
│   │   │   ├── _grid.scss           # 🔲 Сеточные системы и grid-раскладки
│   │   │   ├── _sections.scss       # 📦 Стили секций (отступы, фон и т.д.)
│   │   │   └── _containers.scss     # 📏 Контейнеры, обёртки, центровщики
│   │   ├── pages/                  # 📄 УНИКАЛЬНЫЕ стили для КОНКРЕТНЫХ страниц
│   │   │   ├── _home.scss           # 🏠 Стили ТОЛЬКО для главной страницы
│   │   │   ├── _cases.scss          # 📋 Стили ТОЛЬКО для страницы кейсов
│   │   │   ├── _methodology.scss    # 📊 Стили ТОЛЬКО для страницы методологии
│   │   │   └── _contacts.scss       # 📞 Стили ТОЛЬКО для страницы контактов
│   │   └── utils/                  # 🛠️ Вспомогательные/утилитарные стили
│   │       ├── _helpers.scss        # ❓ Вспомогательные классы (скрыть, показать и т.д.)
│   │       └── _animations.scss     # ✨ Анимации, переходы, трансформации
│   └── js/                         # ⚡ JavaScript файлы
│       ├── main.js                 # 🧠 Главный JavaScript файл (общая логика)
│       └── components-loader.js    # 🔄 Скрипт загрузки header.html и footer.html
└── images/                         # 🖼️ Все изображения проекта
    ├── logos/                      # 🏷️ Логотипы
    ├── screenshots/                # 📸 Скриншоты проектов
    └── backgrounds/                # 🎨 Фоновые изображения
```
## 📍 Правила именования:

- `_имя.scss` — частичные файлы (подключаются через `@use`)
- `site-pages/` — только HTML-страницы (кроме `index.html`)
- `site-components/` — только компоненты (`header.html`, `footer.html`)
- `assets/` — ресурсы: стили, скрипты, изображения
- Все пути — относительные, кроссплатформенные

---
## 🔧 Модульная система SCSS

### Главный файл `assets/scss/main.scss`:

```scss assets/scss/main.scss 
@use "base/variables" as v; 
@use "base/reset"; 
@use "base/typography"; 
@use "base/global"; 
@use "components/header"; 
@use "components/footer"; 
@use "components/buttons"; 
@use "components/cards"; 
@use "components/navigation"; 
@use "layouts/grid"; 
@use "layouts/sections"; 
@use "layouts/containers"; 
@use "pages/home"; 
@use "pages/cases"; 
@use "pages/methodology"; 
@use "pages/contacts"; 
@use "utils/helpers"; 
@use "utils/animations";
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

assets/js/components-loader.js

```javascript
document.addEventListener('DOMContentLoaded', async () => { 
    const components = document.querySelectorAll('[data-component]'); 
    for (const el of components) { const path = el.getAttribute('data-component'); 
        try { const response = await fetch(path); 
            if (response.ok) { el.innerHTML = await response.text(); 
            } 
            else { console.error('Component not found:', path); 
            } 
        } 
        catch (err) { 
            console.error('Failed to load component:', err); 
        } 
    } 
});
```

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

## 🧰 Сборка и разработка

### Скрипты в `package.json`:
```json
"scripts": {
    "sass:build": "sass assets/scss/main.scss:assets/css/main.css --style=compressed",
    "sass:watch": "sass assets/scss/main.scss:assets/css/main.css --watch --style=expanded",
    "purge:css": "node purge.js",
    "build": "npm run sass:build && npm run purge:css",
    "prebuild": "echo '🚀 Запуск сборки...' && mkdir -p assets/css",
    "postbuild": "echo '✅ Сборка завершена. Проверьте assets/css/main.css'",
    "lint:css": "stylelint assets/scss/**/*.scss",
    "lint:css:fix": "stylelint assets/scss/**/*.scss --fix",
    "prepare": "husky install",
    "dev": "concurrently \"npm run sass:watch\" \"live-server\""
}
```

---

## 🌐 Деплой

Сайт доступен по адресу:  
[https://nikolai-karpov.github.io](https://nikolai-karpov.github.io)

---

## 📝 Преимущества структуры

- Уникальные имена папок — нет конфликтов
- **Модульность** — стили до 200 строк, легко поддерживать
- **Автоматизация** — сборка, очистка, проверка стилей
- **Разработка с автообновлением** — `npm run dev`
- **Чистый CSS** — PurgeCSS удаляет неиспользуемое
- **Качество кода** — Stylelint следит за стилями
- Чистая организация — страницы, компоненты, ресурсы разделены
- **Масштабируемость** — легко добавлять страницы и компоненты
- Профессиональный стандарт — соответствует best practices

---

## 🤝 Автор

**Николай Карпов**  
[Email](mailto:nikolai@pir-s.ru) | [Telegram](https://t.me/@Nikolai_999)
```
