```markdown
# Портфолио Николая Карпова

[![Deployed via GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-blue?logo=github)](https://nikolai-karpov.github.io)

Профессиональное портфолио с модульной архитектурой CSS. Чистый код, семантическая вёрстка, продуманная структура проекта.

---

## 🗂 Структура проекта

```
.
├── index.html
├── site-pages/
│   ├── contacts.html
│   ├── methodology.html
│   ├── results.html
│   └── case-studies/
│       ├── index.html
│       ├── construction.html
│       └── procurement.html
├── site-components/
│   ├── header.html
│   └── footer.html
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   ├── base/
│   │   │   ├── _reset.css
│   │   │   ├── _variables.css
│   │   │   ├── _typography.css
│   │   │   └── _global.css
│   │   ├── components/
│   │   │   ├── _header.css
│   │   │   ├── _footer.css
│   │   │   ├── _buttons.css
│   │   │   ├── _cards.css
│   │   │   └── _navigation.css
│   │   ├── layouts/
│   │   │   ├── _grid.css
│   │   │   ├── _sections.css
│   │   │   └── _containers.css
│   │   ├── pages/
│   │   │   ├── _home.css
│   │   │   ├── _cases.css
│   │   │   ├── _methodology.css
│   │   │   └── _contacts.css
│   │   └── utils/
│   │       ├── _helpers.css
│   │       └── _animations.css
│   └── js/
│       ├── main.js
│       └── components-loader.js
└── images/
```

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
