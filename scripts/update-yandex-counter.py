#!/usr/bin/env python3
"""
Скрипт для замены номера счетчика Яндекс.Метрики во всех HTML-файлах
"""

import sys
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

def update_counter_number(filepath, old_counter, new_counter):
    """Заменяем номер счетчика в HTML-файле"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Заменяем номер счетчика
        new_content = content.replace(f'ym({old_counter}', f'ym({new_counter}')
        new_content = new_content.replace(f'watch/{old_counter}', f'watch/{new_counter}')
        
        # Записываем изменения
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True, "Успешно обновлено"
    
    except Exception as e:
        return False, f"Ошибка: {str(e)}"

def main():
    """Главная функция"""
    if len(sys.argv) != 2:
        print("Использование: python3 update-yandex-counter.py <номер_счетчика>")
        print("Пример: python3 update-yandex-counter.py 12345678")
        sys.exit(1)
    
    new_counter = sys.argv[1]
    old_counter = "XXXXXXXXX"
    
    # Проверяем, что номер состоит только из цифр
    if not new_counter.isdigit():
        print("❌ Ошибка: Номер счетчика должен состоять только из цифр")
        sys.exit(1)
    
    # Находим все HTML-файлы
    project_root = Path('.')
    html_files = []
    
    for filepath in project_root.rglob('*.html'):
        if should_process_file(filepath):
            html_files.append(filepath)
    
    html_files.sort()
    
    print(f"Заменяем номер счетчика на: {new_counter}")
    print("="*50)
    print(f"Найдено HTML-файлов: {len(html_files)}")
    print("Начинаем обновление...\n")
    
    # Обрабатываем файлы
    success_count = 0
    error_count = 0
    
    for filepath in html_files:
        success, message = update_counter_number(filepath, old_counter, new_counter)
        
        if success:
            print(f"✅ {filepath}")
            success_count += 1
        else:
            print(f"❌ {filepath} ({message})")
            error_count += 1
    
    print("\n" + "="*50)
    print(f"Готово!")
    print(f"✅ Обновлено: {success_count}")
    print(f"❌ Ошибок: {error_count}")
    print("="*50)
    print(f"\nНомер счетчика заменен на: {new_counter}\n")

if __name__ == '__main__':
    main()