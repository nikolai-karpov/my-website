# Пакет для заявки на доступ к Яндекс.Директ API

Этот пакет заменяет старый файл из `/Users/nik/Documents/yandex-direct-app`, который описывал общий `hermes-agent`. Новый пакет описывает конкретное текущее приложение: read-only мониторинг площадок РСЯ по цели `form_submit`.

Основные файлы:

- `direct-api-placement-monitor-spec.md` — исходная спецификация.
- `direct-api-placement-monitor-spec.docx` — файл для загрузки в заявку.
- `screenshots/*.png` — экранные состояния, встроенные в DOCX.

Старый пакет найден здесь:

- `/Users/nik/Documents/yandex-direct-app/specification.md`
- `/Users/nik/Documents/yandex-direct-app/interface.md`
- `/Users/nik/Documents/yandex-direct-app/application.md`

Почему новый пакет лучше:

- отвечает на вопросы Яндекса по пунктам;
- описывает точную последовательность вызовов Direct API;
- указывает частоту, потоки, лимиты и объем данных;
- показывает обработку ошибки 58 до одобрения;
- включает экранные состояния текущего локального интерфейса/отчетов.

