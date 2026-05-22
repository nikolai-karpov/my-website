#!/usr/bin/env python3
"""
Скрипт для удаления дубликатов кода Яндекс.Метрики из HTML-файлов
"""

import re
from pathlib import Path

def should_process_file(filepath):
    """Проверяем, нужно ли обрабатывать файл"""
    # Проверяем расширение
    if not filepath.suffix == '.html':
        return False
    
    # Директории для исключения
    exclude_dirs = {'node_modules', '.claude', 'alt', 'legacy', '.git'}
    
    # Проверяем, что файл не в исключенных директориях
    parts = filepath.parts
    for part in parts:
        if part in exclude_dirs:
            return False
    
    return True

def remove_duplicate_metrika_code(filepath):
    """Удаляем дубликаты кода Яндекс.Метрики из HTML-файла"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Регулярное выражение для поиска кода Яндекс.Метрики
        metrika_pattern = r'<!-- Yandex\.Metrika counter -->.*?<!-- /Yandex\.Metrika counter -->'
        
        # Находим все вхождения кода Яндекс.Метрики
        matches = list(re.finditer(metrika_pattern, content, re.DOTALL))
        
        if len(matches) <= 1:
            return False, "Нет дубликатов"
        
        # Удаляем все дубликаты, оставляем только первое вхождение
        first_match = matches[0]
        new_content = content[:first_match.end()]
        
        # Добавляем остаток контента после последнего дубликата
        last_match = matches[-1]
        new_content += content[last_match.end():]
        
        # Записываем изменения
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True, f"Удалено {len(matches) - 1} дубликат(ов)"
    
    except Exception as e:
        return False, f"Ошибка: {str(e)}"

def main():
    """Главная функция"""
    # Находим все HTML-файлы
    project_root = Path('.')
    html_files = []
    
    for filepath in project_root.rglob('*.html'):
        if should_process_file(filepath):
            html_files.append(filepath)
    
    html_files.sort()
    
    print("Проверяем и удаляем дубликаты кода Яндекс.Метрики...\n")
    
    # Обрабатываем файлы
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    for filepath in html_files:
        success, message = remove_duplicate_metrika_code(filepath)
        
        if success:
            print(f"✅ {filepath} ({message})")
            fixed_count += 1
        elif "Нет дубликатов" in message:
            print(f"⏭️  {filepath}")
            skipped_count += 1
        else:
            print(f"❌ {filepath} ({message})")
            error_count += 1
    
    print("\n" + "="*50)
    print(f"Готово!")
    print(f"✅ Исправлено: {fixed_count}")
    print(f"⏭️  Пропущено: {skipped_count}")
    print(f"❌ Ошибок: {error_count}")
    print("="*50 + "\n")

if __name__ == '__main__':
    main()