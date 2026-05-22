#!/bin/bash

# Скрипт для добавления кода Яндекс.Метрики на все HTML-страницы проекта

# Код Яндекс.Метрики (замените XXXXXXXX на реальный номер счетчика)
YANDEX_METRIKA_CODE='
<!-- Yandex.Metrika counter -->
<script type="text/javascript" >
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();
   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(XXXXXXXXX, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/XXXXXXXXX" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->
'

# Найти все HTML-файлы (исключая node_modules, .claude, alt/, legacy/)
HTML_FILES=$(find . -name "*.html" -type f | grep -v node_modules | grep -v ".claude" | grep -v "alt/" | grep -v "legacy/" | sort)

echo "Найдено HTML-файлов: $(echo "$HTML_FILES" | wc -l)"
echo "Начинаем добавление кода Яндекс.Метрики..."

# Счетчик обработанных файлов
count=0

for file in $HTML_FILES; do
    # Проверяем, есть ли уже код Яндекс.Метрики в файле
    if grep -q "Yandex.Metrika counter" "$file"; then
        echo "⏭️  Пропускаем $file (код уже есть)"
        continue
    fi
    
    # Добавляем код перед закрывающим тегом </head>
    if sed -i.bak "s|</head>|${YANDEX_METRIKA_CODE}</head>|" "$file"; then
        # Удаляем backup-файл
        rm -f "${file}.bak"
        echo "✅ Добавлено в $file"
        ((count++))
    else
        echo "❌ Ошибка при обработке $file"
        # Восстанавливаем из backup если есть
        if [ -f "${file}.bak" ]; then
            mv "${file}.bak" "$file"
        fi
    fi
done

echo ""
echo "========================================="
echo "Готово! Код добавлен в $count файлов"
echo "========================================="
echo ""
echo "⚠️  ВАЖНО: Замените XXXXXXXX на реальный номер вашего счетчика Яндекс.Метрики"
echo ""