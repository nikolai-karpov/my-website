// purge.js — Очистка неиспользуемых CSS-стилей
const { PurgeCSS } = require('purgecss')
const fs = require('fs')
const path = require('path')

async function purgeCSS() {
  const result = await new PurgeCSS().purge({
    // 🔍 Где искать используемые классы
    content: [
      'index.html',                           // Главная страница
      'new_index.html',                       // Новая версия главной страницы
      'site-pages/**/*.html',                 // Все остальные страницы
      'site-components/**/*.html',            // Компоненты (header, footer)
      'assets/js/**/*.js'                     // JS — на случай динамических классов
    ],

    // 🎨 Какие CSS-файлы обрабатываем
    css: [
      'assets/css/main.css'                  // Только главный файл (уже скомпилированный)
    ],

    // 🛡️ Классы, которые НЕЛЬЗЯ удалять (даже если не нашли в HTML)
    safelist: {
      standard: [
        // Общие классы, которые могут добавляться динамически
        'active', 'hidden', 'show', 'open', 'menu-open', 'visible', 'invisible',
        'loading', 'error', // Добавил общие классы
      ],
      // Классы по шаблону (регулярки)
      greedy: [
        /^btn-/,           // Все кнопки: btn-primary, btn-lg
        /^card-/,          // Все карточки: card, card--competency, case-card-interactive
        /^case-/,          // Кейсы: case-card, case-card-interactive, case-icon, case-footer
        /^tech-/,          // Технологии: tech-card, tech-grid-cards, tech-stack-section
        /^text-/,          // Цвета текста: text-center, text-primary, text-blue-600
        /^bg-/,            // Фоны: bg-light, bg-blue-100
        /^flex/,           // .flex И flex-* классы (включая просто .flex)
        /^grid-/,          // Grid: grid-2, grid-3, cases-grid-3
        /^animate-/,       // Анимации
        /^items-/,         // items-center, items-start
        /^justify-/,       // justify-center, justify-between
        /^gap-/,           // gap-2, gap-3, gap-4
        /^d-/,             // d-block, d-inline-block, d-none
        /^m[btlr]?[0-9]?/, // margin классы: mt-3, mb-2, ml-4, mr-1, m-0
        /^p[btlr]?[0-9]?/, // padding классы: pt-4, pb-2, pl-3, pr-0, p-0
        /^font-/,          // font-weight-bold, font-normal
        /^sr-/,            // screen reader классы
        /^z-/,             // z-10, z-20, z-30
        /^w-/,             // w-full, w-1/2
        /^h-/,             // h-full, h-screen
        /^opacity-/,       // opacity-50, opacity-75
        /^transition-/,    // transition-*
        /^shadow-/,        // shadow-*
        /^rounded-/,       // rounded-*
        /^border-/,        // border-*
        /^overflow-/,      // overflow-*
        /^position-/,      // position-*
        /^top-/,           // top-*
        /^right-/,         // right-*
        /^bottom-/,        // bottom-*
        /^left-/,          // left-*
        /^transform-/,     // transform-*
        /^scale-/,         // scale-*
        /^rotate-/,        // rotate-*
        /^translate-/,     // translate-*
        /^cursor-/,        // cursor-*
      ]
    },

    // 🧹 Экстрактор для корректного поиска классов
    defaultExtractor: content => {
      // Извлекаем слова вида: class="...", className="..."
      return content.match(/[\w-/:]+(?<!:)/g) || []
    }
  })

  // ✅ Перезаписываем основной файл
  if (result.length > 0 && result[0].css) {
    const mainCssPath = 'assets/css/main.css'

    // Создаем папку если её нет
    const dir = path.dirname(mainCssPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(mainCssPath, result[0].css, 'utf8')

    // Проверяем сохраненные классы (для отладки)
    const savedClasses = result[0].css.match(/\.([a-zA-Z0-9_-]+)\b/g) || []
    const targetClasses = ['flex', 'items-center', 'justify-center', 'gap-2']
    const foundClasses = targetClasses.filter(cls =>
    savedClasses.some(saved => saved.includes(cls))
    )

    console.log(`✅ Очищенный CSS сохранён: ${mainCssPath}`)
    console.log(`📊 Найдено целевых классов: ${foundClasses.length}/${targetClasses.length}`)

    if (foundClasses.length < targetClasses.length) {
      console.log(`⚠️  Не найдены: ${targetClasses.filter(cls => !foundClasses.includes(cls)).join(', ')}`)
      console.log('💡 Проверьте:')
      console.log('   1. Что классы есть в исходных SCSS файлах')
      console.log('   2. Что SASS компиляция прошла успешно')
      console.log('   3. Что safelist правильно настроен')
    }

    console.log(`✨ Очистка CSS завершена. Файл: ${mainCssPath}`)
  } else {
    console.log('⚠️ Не удалось очистить CSS. Проверьте конфигурацию.')
    if (result.length === 0) {
      console.log('   Причина: result пустой - возможно ошибка в путях к файлам')
    } else if (!result[0].css) {
      console.log('   Причина: CSS контент пустой')
    }
  }
}

purgeCSS()