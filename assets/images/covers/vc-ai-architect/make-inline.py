"""Build the four editorial diagrams, with portable Inter outlines.

Usage: python3 make-inline.py --font /path/to/Inter-variable.ttf
Requires fontTools, Pillow, and rsvg-convert on PATH. Font source:
https://github.com/google/fonts/tree/main/ofl/inter (SIL Open Font License).
No font installation, external image assets or network requests are needed.
"""

import argparse
from html import escape
from io import BytesIO
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import Image


BG = "#080614"
WHITE = "#FFFFFF"
SECONDARY = "#DED6F5"
AMBER = "#FFB048"
VIOLET = "#A86EFF"
LINE = "#4E4168"
PANEL = "#100E24"
OUT = Path(__file__).resolve().parent
FONTS = {}
LABELS = []


def rect(x, y, w, h, fill=PANEL, stroke=LINE, radius=24):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" '
            f'rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')


def path(d, color=SECONDARY, width=3, extra=""):
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" '
            f'stroke-linecap="round" stroke-linejoin="round" {extra}/>')


def circle(x, y, r, fill=PANEL, stroke=LINE, width=2):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'


def text(x, y, label, size=32, weight=500, color=WHITE, anchor="start"):
    """Baseline-positioned real Inter glyphs; no fallback font on import/export."""
    LABELS.append(label)
    font = FONTS[weight]
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / font['head'].unitsPerEm
    names = [cmap[ord(c)] for c in label]
    total = sum(glyphs[n].width for n in names) * scale
    if anchor == "middle":
        x -= total / 2
    if x < 70 or x + total > 1530:
        raise ValueError(f'Text outside safe area: {label}, {x}, {total}')
    parts = [f'<g role="img" aria-label="{escape(label, quote=True)}"><title>{escape(label)}</title>']
    cursor = 0
    for name in names:
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        commands = pen.getCommands()
        if commands:
            parts.append(f'<path fill="{color}" d="{commands}" transform="translate({x + cursor * scale:.3f} {y}) scale({scale:.6f} {-scale:.6f})"/>')
        cursor += glyphs[name].width
    parts.append('</g>')
    return ''.join(parts)


def arrow(x1, y, x2, color=AMBER):
    return path(f'M{x1} {y} H{x2} m-12 -9 12 9 -12 9', color)


def check(x, y, color=AMBER, scale=1):
    return path(f'M{x} {y} l{10*scale} {10*scale} {22*scale} {-26*scale}', color, 4)


def person(x, y, scale=1, color=SECONDARY):
    return (f'<g transform="translate({x} {y}) scale({scale})">'
            + circle(0, 0, 24, "none", color, 3)
            + path('M-48 88 V64 C-48 22 48 22 48 64 V88 M-26 88 V62 M26 88 V62', color)
            + '</g>')


def document(x, y, w=140, h=170, accent=VIOLET, checked=False):
    p = rect(x, y, w, h, "#16122D", accent, 12)
    p += path(f'M{x+26} {y+38} H{x+w-40}', accent)
    for dy, end in [(70, 28), (96, 44), (122, 34)]:
        if dy < h-20:
            p += path(f'M{x+26} {y+dy} H{x+w-end}', LINE, 3)
    if checked:
        p += circle(x+w-4, y+h-6, 27, BG, AMBER)
        p += check(x+w-19, y+h-6, scale=.8)
    return p


def start(number, title, subtitle, description):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc">'
            f'<title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc>'
            '<defs><radialGradient id="halo"><stop stop-color="#A86EFF" stop-opacity=".12"/>'
            '<stop offset="1" stop-color="#A86EFF" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="blue" x2="1" y2="1"><stop stop-color="#080614"/>'
            '<stop offset=".65" stop-color="#0C1027"/><stop offset="1" stop-color="#080614"/></linearGradient></defs>'
            '<rect width="1600" height="900" fill="url(#blue)"/>'
            '<ellipse cx="1120" cy="480" rx="650" ry="400" fill="url(#halo)"/>'
            + path('M96 72 H1504', LINE, 1)
            + path('M96 72 H184', AMBER, 3)
            + text(96, 122, 'Внедрение ИИ', 26, 600, SECONDARY)
            + text(1504, 122, f'0{number}', 26, 600, AMBER, 'middle')
            + text(96, 214, title, 62, 800)
            + text(96, 272, subtitle, 30, 500, SECONDARY))


def finish(note):
    return (path('M96 782 H1504', LINE, 1)
            + path('M96 816 H140', AMBER, 3)
            + text(166, 829, note, 31, 500, SECONDARY) + '</svg>')


def illustration_01():
    s = start(1, 'Доступ к ИИ — только начало',
              'Быстро получить текст — не значит подготовить принятую работу.',
              'Доступ к инструменту отделён от пригодного результата подготовкой, практикой и проверкой.')
    s += rect(96, 338, 310, 360)
    # Generic access key, not a vendor logo or product interface.
    s += circle(218, 426, 28, 'none', VIOLET, 3)
    s += path('M246 426 H314 M288 426 V446 M310 426 V440', VIOLET, 3)
    s += text(251, 533, 'Доступ', 38, 600, anchor='middle')
    s += text(251, 583, 'к инструменту', 29, color=SECONDARY, anchor='middle')
    s += arrow(430, 514, 485, VIOLET)
    s += path('M528 373 H884 M528 514 H884 M528 655 H884', LINE, 2)
    for y, label in [(338, 'Подготовка'), (479, 'Практика'), (620, 'Проверка')]:
        s += rect(500, y, 412, 78, '#151129', LINE, 16)
        s += circle(540, y+39, 6, AMBER, AMBER)
        s += text(574, y+50, label, 33, 600)
    s += arrow(928, 514, 984)
    s += rect(1010, 338, 494, 360, '#151229', '#79634F')
    s += document(1205, 374, 104, 126, AMBER, True)
    s += text(1257, 575, 'Пригодный результат', 35, 600, anchor='middle')
    s += text(1257, 626, 'для следующего участника', 28, color=SECONDARY, anchor='middle')
    return s + finish('Оценивайте принятую работу, а не количество страниц.')


def illustration_02():
    s = start(2, 'Вебинар не равен внедрению',
              'Нужны реальные задачи сотрудника и помощь в местах затруднений.',
              'Вебинар показывает способ работы. Практика включает постановку задачи, проверку и разбор затруднений; критерий — самостоятельность.')
    s += rect(96, 340, 328, 364)
    s += rect(181, 388, 156, 100, '#17132D', VIOLET, 12)
    s += path('M243 414 L243 461 279 437 Z', VIOLET)
    s += path('M259 488 V513 M228 513 H290', VIOLET)
    s += text(260, 579, 'Вебинар', 37, 600, anchor='middle')
    s += text(260, 631, 'Показать способ', 28, color=SECONDARY, anchor='middle')
    s += arrow(440, 524, 483, VIOLET)
    s += rect(500, 340, 562, 364, '#16122C', '#695184')
    s += person(588, 417, .85)
    s += document(744, 390, 90, 112, VIOLET)
    s += person(965, 417, .85, VIOLET)
    s += path('M639 459 H713 M854 459 H913', LINE, 2)
    s += text(781, 579, 'Практика с поддержкой', 33, 600, anchor='middle')
    s += text(781, 631, 'Задача · проверка · разбор', 28, color=SECONDARY, anchor='middle')
    s += arrow(1078, 524, 1121)
    s += rect(1138, 340, 366, 364, '#151229', '#79634F')
    s += person(1274, 422, .85)
    s += circle(1355, 476, 27, BG, AMBER)
    s += check(1340, 476, scale=.8)
    s += text(1321, 579, 'Самостоятельность', 31, 600, anchor='middle')
    s += text(1321, 631, 'Критерий освоения', 28, color=SECONDARY, anchor='middle')
    return s + finish('Проверка обучения — самостоятельная рабочая задача.')


def illustration_03():
    s = start(3, 'Что подготовить для работы с ИИ',
              'Одного доступа к модели недостаточно.',
              'Рабочую задачу связывают с исходными данными, ролью и навыком, шаблоном и инструментом. Недостающие данные фиксируют как открытый вопрос.')
    # Connections are below nodes in the paint order.
    s += path('M498 403 H582 V471 H638 M498 563 H582 V513 H638', LINE, 2)
    s += path('M962 471 H1018 V403 H1102 M962 513 H1018 V563 H1102', LINE, 2)
    for x, y, title, sub in [
        (96, 344, 'Исходные данные', 'На что опираемся'),
        (96, 504, 'Роль и навык', 'Как выполняем задачу'),
        (1102, 344, 'Шаблон', 'Что должно получиться'),
        (1102, 504, 'Инструмент', 'Где выполняем работу'),
    ]:
        s += rect(x, y, 402, 128, PANEL, LINE, 18)
        s += path(f'M{x+24} {y+26} V{y+99}', VIOLET, 3)
        s += text(x+48, y+49, title, 32, 600)
        s += text(x+48, y+94, sub, 25, 500, SECONDARY)
    s += rect(638, 373, 324, 230, '#1B1532', '#80629F', 32)
    s += circle(800, 420, 9, AMBER, AMBER)
    s += text(800, 493, 'Задача с ИИ', 38, 600, anchor='middle')
    s += text(800, 547, 'Рабочая связка', 27, color=SECONDARY, anchor='middle')
    s += rect(272, 672, 1056, 70, '#1D1723', '#79634F', 16)
    s += text(800, 718, 'Нет данных — открытый вопрос, а не догадка', 32, 600, AMBER, 'middle')
    return s + finish('Шаблоны и правила проверяют на задачах команды.')


def illustration_04():
    s = start(4, 'Готово — когда можно продолжить',
              'Следующему участнику нужен пригодный для работы материал.',
              'Аналитик передаёт документ через проверку пригодности следующему участнику — разработчику. Проверяют чистый текст, понятные схемы и возможность продолжить работу.')
    s += person(236, 416, 1.35)
    s += text(236, 622, 'Аналитик', 35, 600, anchor='middle')
    s += text(236, 671, 'Подготовил', 28, color=SECONDARY, anchor='middle')
    s += arrow(347, 485, 490, VIOLET)
    s += document(530, 372, 162, 202, VIOLET)
    s += text(611, 622, 'Документ', 35, 600, anchor='middle')
    s += text(611, 671, 'Ещё не финиш', 28, color=SECONDARY, anchor='middle')
    s += arrow(719, 485, 796)
    s += rect(824, 344, 314, 366, '#151229', '#79634F', 24)
    s += text(981, 406, 'Приёмка', 35, 600, anchor='middle')
    for y, label in [(466, 'Чистый текст'), (526, 'Понятные схемы'), (586, 'Можно работать')]:
        s += check(846, y-9, scale=.65)
        s += text(884, y, label, 26, 500, SECONDARY)
    s += path('M852 627 H1110', LINE, 1)
    s += text(981, 674, 'Проверка передачи', 26, 600, AMBER, 'middle')
    s += arrow(1162, 485, 1242)
    s += person(1381, 416, 1.35)
    s += text(1381, 622, 'Разработчик', 33, 600, anchor='middle')
    s += text(1381, 671, 'Может продолжить', 26, color=SECONDARY, anchor='middle')
    return s + finish('Проверяйте передачу, а не только выпуск документа.')


def export(stem, svg):
    ET.fromstring(svg)
    target = OUT / f'{stem}.svg'
    target.write_text(svg, encoding='utf-8')
    png = subprocess.run(['rsvg-convert', str(target)], check=True, capture_output=True).stdout
    image = Image.open(BytesIO(png)).convert('RGB')
    assert image.size == (1600, 900)
    for ext, options in [('jpg', {'quality': 93, 'subsampling': 0, 'optimize': True}),
                         ('webp', {'quality': 92, 'method': 6})]:
        output = target.with_suffix('.' + ext)
        image.save(output, **options)
        assert output.stat().st_size < 500_000, output
        print(f'{output.name}: {output.stat().st_size:,} bytes; {image.size}')
    assert target.stat().st_size < 500_000, target
    print(f'{target.name}: {target.stat().st_size:,} bytes; self-contained Inter paths')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font', required=True, type=Path)
    args = parser.parse_args()
    for weight in [500, 600, 800]:
        FONTS[weight] = instantiateVariableFont(TTFont(args.font), {'opsz': 32, 'wght': weight})
    for stem, draw in [
        ('vc-inline-01-start', illustration_01),
        ('vc-inline-02-practice', illustration_02),
        ('vc-inline-03-foundation', illustration_03),
        ('vc-inline-04-handoff', illustration_04),
    ]:
        export(stem, draw())
    print('Visible Russian labels:', ' / '.join(LABELS))


if __name__ == '__main__':
    main()
