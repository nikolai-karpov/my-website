#!/bin/bash

# Скрипт для замены номера счетчика Яндекс.Метрики во всех HTML-файлах

if [ -z "$1" ]; then
    echo "Использование: $0 <номер_счетчика>"
    echo "Пример: $0 12345678"
    exit 1
fi

NEW_COUNTER=$1

echo "Заменяем номер счетчика на: $NEW_COUNTER"
echo "========================================="

# Найти все HTML-файлы (исключая node_modules, .claude, alt/, legacy/)
HTML_FILES=$(find . -name "*.html" -type f | grep -v node_modules | grep -v ".claude" | grep -v "alt/" | grep -v "legacy/" | sort)

count=0

for file in $HTML_FILES; do
    # Заменяем XXXXXXXX на новый номер счетчика
    if sed -i.bak "s/ym(XXXXXXXXX/ym($NEW_COUNTER/g" "$file" && \
       sed -i.bak "s/watch/XXXXXXXXX/watch\/$NEW_COUNTER/g" "$file"; then
        # Удаляем backup-файл
        rm -f "${file}.bak"
        echo "✅ Обновлено: $file"
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
echo "Готово! Обновлено файлов: $count"
echo "========================================="
echo ""
echo "Номер счетчика заменен на: $NEW_COUNTER"
echo ""