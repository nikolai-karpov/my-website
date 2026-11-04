"""Original editorial diagrams. Run with Python 3; no third-party dependencies.

SVG sources are responsive via separate narrow-screen compositions. Embedded
color-scheme follows the article theme. Raster OG export: render og-source.svg
at 1200 × 630 with a browser and save as JPEG.
"""
from pathlib import Path
from html import escape

OUT = Path(__file__).resolve().parent


def text(x, y, lines, size=20, cls="ink", weight=500):
    if isinstance(lines, str):
        lines = [lines]
    return ''.join(f'<text x="{x}" y="{y+i*(size+8)}" class="{cls}" font-size="{size}" font-weight="{weight}">{escape(line)}</text>' for i, line in enumerate(lines))


def box(x, y, w, h, cls="card"):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" class="{cls}"/>'


def path(d, cls="flow", dash=False):
    dashed = 'stroke-dasharray="6 6"' if dash else ''
    return f'<path d="{d}" class="{cls}" fill="none" stroke-width="2" {dashed} marker-end="url(#arrow)"/>'


def svg(w, h, title, desc, content):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc>
<style>
svg{{font-family:Inter,Arial,sans-serif;background:#f6f5f2}}
.bg{{fill:#f6f5f2}} .ink{{fill:#18212c}} .muted{{fill:#536171}}
.card{{fill:#fff;stroke:#cbd2da;stroke-width:1.5}}
.flow{{stroke:#637185}} .amber{{fill:#8c5100}} .stop{{fill:#fff1db;stroke:#bb781c}}
.blue{{fill:#edf4ff;stroke:#3571bc;stroke-width:2}} .green{{fill:#eaf6ee;stroke:#28744d;stroke-width:2}}
.blue-text{{fill:#225ba0}} .green-text{{fill:#216440}}
@media(prefers-color-scheme:dark){{svg{{background:#151923}} .bg{{fill:#151923}} .ink{{fill:#f4f2ed}} .muted{{fill:#bcc6d5}} .card{{fill:#202634;stroke:#4c576b}} .flow{{stroke:#a5b1c4}} .amber{{fill:#ffb048}} .stop{{fill:#30291e;stroke:#c98c37}} .blue{{fill:#1b2a43;stroke:#81b6ff}} .green{{fill:#19372a;stroke:#70d69d}} .blue-text{{fill:#a7ceff}} .green-text{{fill:#93e8b7}}}}
</style>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" class="muted"/></marker></defs>
<rect width="{w}" height="{h}" rx="20" class="bg"/>{content}</svg>'''


def cycle(mobile=False):
    labels = [("Проблема", "Есть свидетельства?"), ("Гипотеза", "Что проверяем?"), (["Требования", "и прототип"], "Понятен сценарий?"), ("Реализация", "Решение проверено?"), ("Выпуск", "Готов возврат?"), (["Проверка", "эффекта"], "Есть польза?")]
    if mobile:
        c = text(24, 34, "01 / ЦИКЛ ПРОДУКТА", 14, "amber", 700)
        for i, (label, sub) in enumerate(labels):
            y = 60+i*168
            c += box(24,y,312,132) + text(42,y+27,f"0{i+1}",14,"amber",700)
            c += text(42,y+56,label,22,"ink",600)
            c += text(42,y+114,sub,16,"muted")
            if i<5: c += path(f"M180 {y+133} V{y+161}")
        y=1090
        c += box(24,y,312,108,"stop") + text(42,y+30,"Проблема не подтверждена",17,"ink",600)
        c += text(42,y+59,["Стоп: не начинаем разработку.","При необходимости — исследуем."],15,"muted")
        c += text(24,1234,["↶ Прототип выявил непонимание:","возвращаемся к решению."],16,"ink")
        c += text(24,1300,["↶ Нет пользы после выпуска:","пересматриваем гипотезу."],16,"ink")
        return svg(360,1368,"AI PDLC: этапы и решения о возврате","Шесть этапов с проверкой. Неподтверждённая проблема — остановка, непонятный прототип — возврат к решению, отсутствие пользы — пересмотр гипотезы.",c)
    c=text(32,40,"01 / ЦИКЛ ПРОДУКТА",15,"amber",700)+text(32,78,"Проверяем результат — затем идём дальше",26,"ink",600)
    coords=[(32,116),(332,116),(632,116),(632,340),(332,340),(32,340)]
    for i,((label,sub),(x,y)) in enumerate(zip(labels,coords)):
        c+=box(x,y,256,160)+text(x+20,y+29,f"0{i+1}",14,"amber",700)+text(x+20,y+66,label,25,"ink",600)+text(x+20,y+137,sub,17,"muted")
    for d in ["M288 196 H326","M588 196 H626","M760 276 V334","M632 420 H594","M332 420 H294"]: c+=path(d)
    c+=path("M700 276 V300 H540 V282",dash=True)
    c+=text(550,326,"Уточняем решение",15,"muted")
    c+=path("M160 340 V300 H400 V282",dash=True)+text(176,326,"Нет пользы → к гипотезе",15,"muted")
    c+=text(32,553,"Сплошная линия — следующий этап. Пунктир — возврат или остановка.",18,"muted")
    c+=path("M160 276 V290 H20 V580 H64 V594",dash=True)
    c+=box(32,600,856,82,"stop")+text(54,630,"Проблема не подтверждена → разработку не начинаем",21,"ink",600)+text(54,659,"Остановка или дополнительное исследование — не обязательный переход дальше.",17,"muted")
    return svg(920,710,"AI PDLC: цикл с проверками и возвратами","Проблема, гипотеза, требования и прототип, реализация, выпуск, проверка эффекта. Пунктир — возвраты. При неподтверждённой проблеме разработку не начинаем.",c)


def deployment(mobile=False):
    w=360 if mobile else 920
    c=text(24 if mobile else 32,36,"02 / BLUE–GREEN",14,"amber",700)
    for i in range(2):
        x=24 if mobile else 32+i*448
        y=65+i*425 if mobile else 72
        pw=312 if mobile else 408
        c+=box(x,y,pw,390)
        c+=text(x+20,y+32,"ДО ПЕРЕКЛЮЧЕНИЯ" if i==0 else "ПОСЛЕ ПЕРЕКЛЮЧЕНИЯ",15,"muted",700)
        c+=text(x+20,y+73,"Пользователи",22,"ink",600)
        c+=path(f"M{x+pw/2} {y+85} V{y+110}")
        c+=box(x+20,y+120,pw-40,52)+text(x+38,y+153,"Маршрутизатор",20,"ink",600)
        c+=path(f"M{x+pw/2} {y+172} V{y+197}")
        c+=box(x+20,y+206,pw-40,78,"blue" if i==0 else "green")
        c+=text(x+38,y+236,"BLUE · текущая версия" if i==0 else "GREEN · новая версия",18,"blue-text" if i==0 else "green-text",700)
        c+=text(x+38,y+263,"ОБСЛУЖИВАЕТ ТРАФИК",13,"ink",700)
        c+=box(x+20,y+300,pw-40,70,"green" if i==0 else "blue")
        c+=text(x+38,y+327,"GREEN · новая версия" if i==0 else "BLUE · прежняя версия",18,"green-text" if i==0 else "blue-text",700)
        c+=text(x+38,y+352,"На проверке · без трафика" if i==0 else "Сохранена для возврата",15,"muted")
    if mobile:
        c+=path("M180 460 V484")
        c+=path("M310 924 H50",dash=True)
        c+=text(24,958,["Возврат трафика на BLUE:","только при сохранённой", "совместимости."],18,"ink",600)
        c+=box(24,1044,312,166,"stop")+text(42,1074,"НЕ ОТКАТЫВАЕТ АВТОМАТИЧЕСКИ",12,"amber",700)
        c+=text(42,1107,["Изменения данных", "Платежи", "Отправленные уведомления"],17,"ink")
        return svg(w,1234,"Blue-green: до и после переключения","Трафик переходит с blue на green после проверок. Возврат на blue возможен только при совместимости. Данные, платежи и уведомления требуют отдельного плана.",c)
    c+=path("M442 268 H472")
    c+=path("M684 472 V503 H236 V472",dash=True)
    c+=text(204,539,"Возврат на BLUE — только при сохранённой совместимости",18,"ink",600)
    c+=box(32,572,856,102,"stop")+text(54,604,"Возврат трафика ≠ возврат состояния системы",23,"ink",600)
    c+=text(54,642,"Данные, платежи и уведомления требуют отдельного плана восстановления.",18,"muted")
    return svg(w,706,"Blue-green: до и после переключения","Слева трафик обслуживает blue, green на проверке. Справа трафик обслуживает green, blue сохранена. Пунктирный возврат допустим только при совместимости. Изменения данных и внешние действия не отменяются автоматически.",c)


def cover():
    c='''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc"><title id="title">AI PDLC: от пользовательской проблемы до безопасного выпуска</title><desc id="desc">Редакционная обложка: шесть этапов цикла продукта и обратная связь.</desc><defs><radialGradient id="glow"><stop stop-color="#A86EFF" stop-opacity=".22"/><stop offset="1" stop-color="#A86EFF" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="#10131c"/><ellipse cx="940" cy="300" rx="470" ry="420" fill="url(#glow)"/><path d="M56 48 H1144" stroke="#333949"/><style>text{font-family:Inter,Arial,sans-serif}.ink{fill:#fff}.muted{fill:#c6c7d5}.amber{fill:#ffb048}</style>'''
    c+=text(56,89,"НИКОЛАЙ КАРПОВ / ПРАКТИКА РАЗРАБОТКИ",17,"amber",600)
    c+=text(52,221,"AI PDLC",105,"ink",700)
    c+=text(56,292,["От пользовательской проблемы", "до безопасного выпуска"],36,"ink",500)
    c+='<path d="M56 374 H1144" stroke="#333949"/>'
    labels=["ПРОБЛЕМА","ГИПОТЕЗА","ПРОТОТИП","РЕАЛИЗАЦИЯ","ВЫПУСК","ЭФФЕКТ"]
    for i,label in enumerate(labels):
        x=56+i*185
        c+=f'<circle cx="{x+10}" cy="420" r="7" fill="{"#ffb048" if i<4 else "#80d4b0"}"/>'
        if i<5:c+=f'<path d="M{x+24} 420 H{x+175}" stroke="#6d6684" stroke-width="2"/>'
        c+=text(x,462,label,15,"muted",600)
    c+='<path d="M991 485 V523 H66 V485 M59 494 L66 484 L73 494" fill="none" stroke="#A86EFF" stroke-width="2" stroke-dasharray="6 5"/>'
    c+=text(380,557,"ПРОВЕРКА → РЕШЕНИЕ → СЛЕДУЮЩИЙ ЦИКЛ",15,"muted",500)
    return c+'</svg>'


if __name__ == '__main__':
    for name, content in {
        'cycle.svg':cycle(), 'cycle-mobile.svg':cycle(True),
        'blue-green.svg':deployment(), 'blue-green-mobile.svg':deployment(True),
        'og-source.svg':cover(),
    }.items():
        (OUT/name).write_text(content, encoding='utf-8')
        print(name)
