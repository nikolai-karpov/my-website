## Что такое Git Credential Manager (GCM)

Git Credential Manager — это утилита, которая безопасно хранит ваши учетные данные (включая Personal Access Tokens, PAT) и автоматически подставляет их при работе с Git по HTTPS. Вместо того чтобы хранить токен в `.git/config` или вводить его каждый раз, GCM сохраняет данные в системном хранилище (Keychain на macOS).

---

## 1. Когда использовать SSH, а когда HTTPS с GCM

- **SSH (текущая настройка репозитория)**:
  - Использует ключи из `~/.ssh/`
  - Не требует токена или пароля при каждой операции
  - Хорошо подходит для основного рабочего компьютера

- **HTTPS + Git Credential Manager**:
  - Удобен, если вы:
    - часто меняете машины
    - работаете в окружениях, где SSH запрещён
  - Хранит токены в безопасном хранилище и автоматически подставляет их при запросах к GitHub

Вы можете использовать оба способа параллельно на разных клонах репозитория или на разных машинах.

---

## 2. Установка Git Credential Manager на macOS

### Вариант 1: Через Homebrew (рекомендуется)

```bash
brew install git-credential-manager
```

После установки активируйте GCM:

```bash
git-credential-manager configure
```

**Примечание:** Установка через Homebrew требует пароль администратора для установки системных компонентов.

### Вариант 2: Через официальный установщик

1. Зайдите на страницу релизов: https://github.com/git-ecosystem/git-credential-manager/releases/latest
2. Скачайте файл `gcm-osx-x64-*.pkg` для macOS
3. Установите пакет обычным способом (двойной клик → инструкции установщика)
4. В терминале выполните:

```bash
git-credential-manager configure
```

---

## 3. Настройка GCM для работы с GitHub

После установки GCM перехватывает запросы Git к учетным данным.

### Базовая настройка Git

Убедитесь, что у вас включён хелпер:

```bash
git config --global credential.helper manager-core
```

Проверьте:

```bash
git config --global credential.helper
```

Должно вернуть:

```text
manager-core
```

### Первое подключение к GitHub по HTTPS

1. В любом репозитории с HTTPS-URL выполните:

```bash
git fetch
```

или

```bash
git push
```

2. Git Credential Manager:
   - откроет окно аутентификации
   - предложит войти через браузер в GitHub
3. После успешного входа:
   - GCM сохранит токен в системном Keychain
   - при следующих операциях Git больше не будет спрашивать пароль/токен

---

## 4. Настройка GCM для работы с GitVerse

GitVerse (gitverse.ru) — российская платформа для хостинга Git-репозиториев. GCM настроен для работы с GitVerse аналогично GitHub.

### Настройка для GitVerse

GCM уже настроен для автоматической работы с GitVerse. При первой операции с репозиторием GitVerse:

1. Выполните любую команду, требующую аутентификации:
   ```bash
   git fetch
   ```
   или
   ```bash
   git push
   ```

2. Git Credential Manager:
   - откроет окно аутентификации
   - предложит ввести логин и пароль (или токен) от GitVerse
   - сохранит учетные данные в macOS Keychain

3. При следующих операциях GCM автоматически подставит сохранённые данные.

### Проверка настройки

Убедитесь, что GCM настроен для GitVerse:

```bash
git config --global credential.https://gitverse.ru.helper
```

Должно вернуть:
```text
manager-core
```

### Использование Personal Access Token для GitVerse

Для большей безопасности рекомендуется использовать Personal Access Token вместо пароля:

1. Создайте токен в GitVerse:
   - Зайдите в настройки аккаунта GitVerse
   - Перейдите в раздел "Токены доступа" или "Personal Access Tokens"
   - Создайте новый токен с необходимыми правами

2. При первой операции GCM попросит ввести логин и токен (вместо пароля)

3. GCM сохранит токен в Keychain для последующего использования

---

## 5. Как переключиться с SSH на HTTPS с GCM в этом проекте

Сейчас репозиторий настроен на SSH-URL:

```bash
git remote -v
```

вернёт примерно:

```text
origin  git@github.com:nikolai-karpov/my-website.git (fetch)
origin  git@github.com:nikolai-karpov/my-website.git (push)
```

Если вы захотите **использовать HTTPS + GCM вместо SSH** для этого клона:

1. Измените URL remote:

```bash
cd /Users/nik/my-website
git remote set-url origin https://github.com/nikolai-karpov/my-website.git
```

2. Убедитесь, что включён GCM:

```bash
git config --global credential.helper manager-core
```

3. Выполните любую команду, требующую аутентификации:

```bash
git fetch
```

или

```bash
git push
```

4. В открывшемся окне войдите в GitHub. GCM сохранит токен в macOS Keychain.

> Важно: **не добавляйте токен в URL** (вроде `https://ghp_xxx@github.com/...`). GCM сам сохранит и подставит токен.

---

## 6. Безопасное хранение и управление учетными данными

- **Где хранятся данные на macOS**:
  - GCM использует **macOS Keychain** (Связка ключей)
  - Доступ защищён вашей учетной записью macOS

- **Посмотреть/удалить сохранённые учетные данные**:
  1. Откройте приложение «Связка ключей» (Keychain Access)
  2. В поиске введите `git` или `github.com`
  3. Вы можете удалить запись, если нужно сбросить сохранённый токен

- **Сброс кэша GCM из терминала**:

```bash
git credential-manager-core erase
```

GCM запросит у вас уточнение, для какого хоста стирать учетные данные (например, `github.com`).

---

## 7. Проверка работы и отладка

### Проверить, какой helper сейчас используется

```bash
git config --show-origin credential.helper
```

Вы увидите файл и значение, из которого берётся настройка (например, `~/.gitconfig` и `manager-core`).

### Если Git по-прежнему спрашивает пароль в консоли

1. Убедитесь, что **нет других helper'ов**, переопределяющих GCM:

```bash
git config --global --unset credential.helper
git config --system --unset credential.helper 2>/dev/null || true
git config --global credential.helper manager-core
```

2. Повторите попытку `git fetch` или `git push`.

---

## 8. Резюме по выбору между SSH и HTTPS+GCM

- **SSH (то, что сейчас настроено для `origin` в этом репозитории)**:
  - Не требует Git Credential Manager
  - Использует ключи в `~/.ssh/`
  - Хороший выбор для основного рабочего окружения

- **HTTPS + GCM**:
  - Удобен, если нужны «браузерные» логины и централизованное управление токенами
  - Токены не попадают в `.git/config` и не лежат в открытом виде
  - Можно легко отозвать токены через веб-интерфейс GitHub

Вы можете держать **этот клон на SSH**, а для других машин/проектов настроить **HTTPS + GCM**, используя эту инструкцию.


