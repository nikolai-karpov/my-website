#!/usr/bin/env python3
"""
Скрипт для добавления кода Яндекс.Метрики на все HTML-страницы проекта
"""

import os
import re
from pathlib import Path

# Код Яндекс.Метрики (замените XXXXXXXX на реальный номер счетчика)
YANDEX_METRIKA_CODE = '''
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
'''

# Директории для исключения
EXCLUDE_DIRS = {'node_modules', '.claude', 'alt', 'legacy', '.git'}

def should_process_file(filepath):
    """Проверяем, нужно ли обрабатывать файл"""
    # Проверяем расширение
    if not filepath.suffix == '.html':
        return False
    
    # Проверяем, что файл не в исключенных директориях
    parts = filepath.parts
    for part in parts:
        if part in EXCLUDE_DIRS:
            return False
    
    return True

def add_metrika_code(filepath):
    """Добавляем код Яндекс.Метрики в HTML-файл"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Проверяем, есть ли уже код Яндекс.Метрики (используем регулярное выражение)
        metrika_pattern = r'<!-- Yandex\.Metrika counter -->.*?<!-- /Yandex\.Metrika counter -->'
        metrika_blocks = re.findall(metrika_pattern, content, re.DOTALL)
        
        if len(metrika_blocks) > 0:
            return False, f"Код уже есть ({len(metrika_blocks)} блок(ов))"
        
        # Добавляем код перед закрывающим тегом </head>
        new_content = content.replace('</head>', YANDEX_METRIKA_CODE + '</head>')
        
        # Записываем изменения
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True, "Успешно добавлено"
    
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
    
    print(f"🔍 Сканирование проекта...")
    print(f"📁 Найдено HTML-файлов: {len(html_files)}")
    print("🚀 Начинаем добавление кода Яндекс.Метрики...\n")
    
    # Обрабатываем файлы
    success_count = 0
    skipped_count = 0
    error_count = 0
    duplicate_count = 0
    
    for filepath in html_files:
        success, message = add_metrika_code(filepath)
        
        if success:
            print(f"✅ {filepath}")
            success_count += 1
        elif "Код уже есть" in message:
            # Проверяем количество блоков метрики
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                metrika_pattern = r'<!-- Yandex\.Metrika counter -->'
                blocks = len(re.findall(metrika_pattern, content))
            
            if blocks > 1:
                print(f"⚠️  {filepath} ({message}) - ОБНАРУЖЕН {blocks} БЛОК(ОВ)!")
                duplicate_count += 1
            else:
                print(f"⏭️  {filepath} ({message})")
                skipped_count += 1
        else:
            print(f"❌ {filepath} ({message})")
            error_count += 1
    
    print("\n" + "="*60)
    print(f"✅ Операция завершена!")
    print("="*60)
    print(f"📊 Статистика:")
    print(f"   ✅ Добавлено: {success_count}")
    print(f"   ⏭️  Пропущено (код уже есть): {skipped_count}")
    print(f"   ⚠️  Дубликатов обнаружено: {duplicate_count}")
    print(f"   ❌ Ошибок: {error_count}")
    print("="*60)
    
    if duplicate_count > 0:
        print(f"\n⚠️  ВНИМАНИЕ: Обнаружены дубликаты кода Яндекс.Метрики!")
        print(f"   Запустите: python3 scripts/remove-duplicate-metrika.py")
    
    print(f"\n💡 Скрипт можно запускать многократно - дубликаты не создаются\n")

if __name__ == '__main__':
    main()