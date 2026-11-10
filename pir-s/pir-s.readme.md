# ПИР-СИСТЕМА

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Version](https://img.shields.io/badge/version-1.0-blue.svg)]()

🔧 Детальная документация

**Основная документация:**
- [Обзор приложения](docs/product.md) - назначение, пользователи, функции, бизнес-цели
- [Технологический стек](docs/tech.md) - фреймворки, библиотеки, инструменты, обоснование выбора
- [Структура проекта](docs/structure.md) - организация файлов, соглашения, паттерны
- [Техническая документация](docs/docs.md) - полная техническая документация системы

**Компоненты системы:**
- [Web client](client/README.md)
- [Backend](server/README.md)
- [Admin Panel](admin-panel/) - админ-панель для управления пользователями и тарифами
- [AI-GIP Service](ai-gip/README.md) - AI-сервис для анализа ИРД
- [Deployment](deploy/README.md)
- [Hasura development](hasura/README.md)
- [Seeder](seeder/README.md)

**Руководства:**
- [Локальный запуск без Docker](docs/LOCAL_RUN_WITHOUT_DOCKER.md)
- [🛠️ Установка инструментов разработчика (React DevTools)](DEVTOOLS_SETUP.md)

## 🚀 Быстрый старт (5 минут)

### Предварительные требования

- Node.js >=20.15.0
- PostgreSQL 12.0+
- Docker & Docker Compose
- Python 3.10+ (для AI-сервиса)

```bash
# 1. Клонировать проект
git clone https://github.com/pir-s/pir-s.ru
cd pir-s.ru

# 2. Запустить всю систему
export ENVIRONMENT=dev
/bin/bash ./deploy/scripts/deploy.sh

# 3. Система будет доступна:

Клиент: http://localhost:8081
API: http://localhost:3000
Hasura Console: http://localhost:9081
GraphQL: http://localhost:8080/v1/graphql
IRD API: http://localhost:8502
Админ-панель: http://localhost:5173 (если запущена отдельно)

📖 О проекте
Система управления проектами и задачами с поддержкой REST и GraphQL API. Включает AI-сервис для анализа исходно-разрешительной документации (ИРД).

Технологии: React, Node.js, Python/FastAPI, PostgreSQL, Hasura GraphQL, Redis, Qdrant, Docker

🔒 Безопасность
**ВАЖНО:** При работе с Docker volumes базы данных всегда используйте безопасные скрипты:
- `./scripts/safe-volume-create.sh` - для создания volumes с автоматическим backup
- `./scripts/db-backup.sh` - для создания backup базы данных

См. [AGENT_SAFETY_RULES.md](AGENT_SAFETY_RULES.md) для правил безопасности при работе с базой данных.

🏗 Архитектура
```
Клиент (React) ↔ REST API (Express) ↔ PostgreSQL
       │              │                      │
       │              │                      │
       └──────────────┴──────────────────────┘
                      │
                      ▼
              GraphQL (Hasura) ↔ PostgreSQL
                      │
                      ▼
              IRD API (FastAPI) ↔ Redis ↔ Qdrant
```

📁 Структура проекта
```
pir-s.ru/
├── client/              # React фронтенд приложение
├── server/              # Node.js бэкенд (REST API)
├── admin-panel/         # React админ-панель
├── ai-gip/              # Python AI-сервис для анализа ИРД
├── hasura/              # Hasura GraphQL Engine (миграции, метаданные)
├── seeder/              # Скрипты для заполнения БД тестовыми данными
├── deploy/              # Конфигурация деплоя и Docker
├── qdrant-config/       # Конфигурация векторной БД Qdrant
├── docs/                # Документация проекта
├── scripts/             # Вспомогательные скрипты
└── docker-compose.yaml  # Оркестрация Docker контейнеров
```

🛠 Технологический стек

**Фронтенд:**
- React 18 + TypeScript
- Redux для управления состоянием
- Apollo Client для GraphQL
- Vite для сборки
- Storybook для разработки компонентов
- Ant Design (в админ-панели)

**Бэкенд:**
- Node.js >=20.15.0 + Express
- Python 3.10+ + FastAPI (AI-сервис)
- PostgreSQL + Hasura GraphQL Engine
- Redis для кэширования
- JWT аутентификация

**Инфраструктура:**
- Docker + Docker Compose
- Nginx + Supervisord (production)
- Qdrant для векторного поиска

**Тестирование:**
- Vitest для unit тестов
- Mocha для API тестов
- CodeceptJS для E2E тестов
```
