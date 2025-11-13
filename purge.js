// purge.js — Очистка неиспользуемых CSS-стилей
const { PurgeCSS } = require('purgecss')

async function purgeCSS() {
  const result = await new PurgeCSS().purge({
    // 🔍 Где искать используемые классы
    content: [
      'index.html',                           // Главная страница
      'site-pages/**/*.html',                 // Все остальные страницы
      'site-components/**/*.html',            // Компоненты (header, footer)
      'assets/js/**/*.js'                     // JS — на случай динамических классов
    ],

    // 🎨 Какие CSS-файлы обрабатываем
    css: [
      'assets/css/main.css',                  // Главный файл (или можно указать все .css)
      'assets/css/**/*.css'                   // Все стили (на всякий случай)
    ],

    // 📦 Куда сохранить очищенные стили
    output: 'assets/css/purged',              // Результат: assets/css/purged/main.css

    // 🛡️ Классы, которые НЕЛЬЗЯ удалять (даже если не нашли в HTML)
    safelist: {
      standard: [
        // Общие классы, которые могут добавляться динамически
        'active', 'hidden', 'show', 'open', 'menu-open', 'visible', 'invisible'
      ],
      // Классы по шаблону (регулярки)
      greedy: [
        /^btn-/,     // Все кнопки: btn-primary, btn-lg
        /^card-/,    // Все карточки
        /^text-/,    // Цвета текста
        /^bg-/,      // Фоны
        /^flex-/,    // Flex-классы
        /^grid-/,    // Grid
        /^animate-/  // Анимации
      ]
    },

    // 🧹 Экстрактор для корректного поиска классов
    defaultExtractor: content => {
      // Извлекаем слова вида: class="...", className="..."
      return content.match(/[\w-/:]+(?<!:)/g) || []
    }
  })

  // ✅ Логируем результат
  result.forEach(file => {
    console.log(`✅ Очищенный CSS сохранён: ${file.file}`)
  })

  console.log('✨ Очистка CSS завершена. Подключи новый файл: assets/css/purged/main.css')
}

purgeCSS()