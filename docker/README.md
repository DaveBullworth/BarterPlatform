# BarterPlatform — Deployment Guide

This document describes how to deploy and update BarterPlatform in a production
environment using Docker and prebuilt images hosted on the GitHub Container
Registry (GHCR).

The published images are **public**, so no access token or `docker login` step
is required to pull them.

---

## 1. Initial Deployment

The following procedure provisions a fresh Linux VM and brings the application
online for the first time.

### 1.1. Prerequisites

- A Linux VM with shell access and outbound internet connectivity.
- The production environment files for the `server` and `client` services
  (see section [3](#3-environment-files) for the full variable reference).

### 1.2. Install Docker

If Docker is not already installed, install it using the official convenience
script:

```bash
curl -fsSL https://get.docker.com | sh
```

### 1.3. Prepare the Project Directory

Create the project directory and place the required files in the following
layout:

```
/barter
├── docker-compose.yml
├── server/.env
└── client/.env
```

- **`docker-compose.yml`** — use the compose file from
  [docker/docker-compose.yml](https://github.com/DaveBullworth/BarterPlatform/blob/main/docker/docker-compose.yml).
- **`server/.env`** and **`client/.env`** — see section
  [3](#3-environment-files).

### 1.4. Pull the Images

The images are public on GHCR, so no authentication is needed. Download the
latest application images referenced by the compose file:

```bash
docker compose -f docker-compose.yml pull
```

### 1.5. Start the Stack

Launch the application in detached mode:

```bash
docker compose -f docker-compose.yml up -d
```

### 1.6. Verify the Deployment

Confirm that all containers are running:

```bash
docker ps
```

All services defined in the compose file should be listed with status `Up`.

---

## 2. Updating an Existing Deployment

The update procedure is split between developer and DevOps responsibilities.
Developers publish new image versions; DevOps rolls them out to the running
environment.

### 2.1. Developer Steps

#### 2.1.1. Rebuild the Docker Images

Build the `server` and `client` images, tagging them with the new version:

```bash
docker build -t ghcr.io/davebullworth/barter-server:1.1 -f docker/Dockerfile.server .
docker build -t ghcr.io/davebullworth/barter-client:1.1 -f docker/Dockerfile.client .
```

#### 2.1.2. Push the Images to GHCR

Publish the rebuilt images to the registry:

```bash
docker push ghcr.io/davebullworth/barter-server:1.1
docker push ghcr.io/davebullworth/barter-client:1.1
```

#### 2.1.3. Bump the Version in `docker-compose.yml`

Update the image tags referenced by the compose file:

```yaml
server:
  image: ghcr.io/davebullworth/barter-server:1.1

client:
  image: ghcr.io/davebullworth/barter-client:1.1
```

Commit and push the change so the updated compose file is available to DevOps.

### 2.2. DevOps Steps

#### 2.2.1. Update `docker-compose.yml`

Pull the latest version of `docker-compose.yml` onto the host so the new image
tags take effect.

#### 2.2.2. Pull the Updated Images

```bash
docker compose pull
```

#### 2.2.3. Restart the Containers

Recreate the containers with the new images:

```bash
docker compose up -d
```

Verify the deployment as described in section
[1.6](#16-verify-the-deployment).

---

## 3. Environment Files

The stack reads configuration from two separate files: `server/.env` (consumed
by the NestJS API and Postgres container) and `client/.env` (consumed by the
Vite-built React client). Both files must exist before the stack is started —
the compose file references them via `env_file:`.

### 3.1. `server/.env`

#### Application

| Variable   | Required | Example      | Description                                                                                                 |
| ---------- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `PORT`     | yes      | `3000`       | Port the NestJS server binds to inside the container. Must match the compose port mapping.                  |
| `NODE_ENV` | yes      | `production` | Runtime mode. Use `production` in deployed environments; controls TypeORM `synchronize` and seed behaviour. |
| `SEED`     | no       | `true`       | When `true`, runs the admin seed on startup (creates the initial admin user if missing).                    |

#### Postgres

These values are read by both the API (TypeORM) and the `postgres` container
(via the official image's `POSTGRES_*` variables), so they must be consistent.

| Variable            | Required | Example    | Description                                                                  |
| ------------------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `POSTGRES_HOST`     | yes      | `postgres` | Hostname of the Postgres service. Use the compose service name (`postgres`). |
| `POSTGRES_PORT`     | yes      | `5432`     | Postgres port.                                                               |
| `POSTGRES_USER`     | yes      | `postgres` | Postgres superuser used by the API.                                          |
| `POSTGRES_PASSWORD` | yes      | `postgres` | Password for `POSTGRES_USER`. Use a strong value in production.              |
| `POSTGRES_DB`       | yes      | `barter`   | Name of the application database.                                            |

#### Redis

| Variable     | Required | Example | Description                                                            |
| ------------ | -------- | ------- | ---------------------------------------------------------------------- |
| `REDIS_HOST` | yes      | `redis` | Hostname of the Redis service. Use the compose service name (`redis`). |
| `REDIS_PORT` | yes      | `6379`  | Redis port.                                                            |

#### Initial Admin (used only when `SEED=true`)

| Variable         | Required | Example              | Description                                        |
| ---------------- | -------- | -------------------- | -------------------------------------------------- |
| `ADMIN_EMAIL`    | yes      | `admin@barter.local` | Email of the seeded admin user.                    |
| `ADMIN_LOGIN`    | yes      | `admin`              | Login of the seeded admin user.                    |
| `ADMIN_NAME`     | yes      | `Radion`             | Display name of the seeded admin user.             |
| `ADMIN_PASSWORD` | yes      | `admin123`           | Initial admin password — change after first login. |

#### Auth & Sessions

| Variable               | Required | Example            | Description                                                                  |
| ---------------------- | -------- | ------------------ | ---------------------------------------------------------------------------- |
| `ACCESS_TOKEN_SECRET`  | yes      | long random string | JWT signing secret for access tokens. Use a long random value in production. |
| `REFRESH_TOKEN_SECRET` | yes      | long random string | JWT signing secret for refresh tokens. Must differ from the access secret.   |
| `MAX_SESSIONS`         | no       | `3`                | Maximum concurrent sessions per user (defaults to `3`).                      |
| `DEFAULT_PASSWORD`     | no       | `default_password` | Fallback password used by some user-creation flows.                          |

#### Mail (SMTP)

Used for email confirmation and password reset.

| Variable         | Required | Example                       | Description                                                                          |
| ---------------- | -------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| `EMAIL_HOST`     | yes      | `smtp.yandex.ru`              | SMTP server hostname.                                                                |
| `EMAIL_USERNAME` | yes      | `noreply@yandex.by`           | SMTP login / `From` address.                                                         |
| `EMAIL_PASSWORD` | yes      | application-specific password | SMTP password (use an app password, not the account one).                            |
| `FRONTEND_URL`   | yes      | `https://barter.example.com`  | Public base URL of the client; used to build links in confirmation and reset emails. |

#### Example `server/.env`

```env
PORT=3000
NODE_ENV=production
SEED=true

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=barter

REDIS_HOST=redis
REDIS_PORT=6379

ADMIN_EMAIL=admin@barter.local
ADMIN_LOGIN=admin
ADMIN_NAME=Radion
ADMIN_PASSWORD=change-me

ACCESS_TOKEN_SECRET=replace-with-long-random-string
REFRESH_TOKEN_SECRET=replace-with-different-long-random-string
MAX_SESSIONS=3
DEFAULT_PASSWORD=default_password

EMAIL_HOST=smtp.yandex.ru
EMAIL_USERNAME=noreply@yandex.by
EMAIL_PASSWORD=app-specific-password
FRONTEND_URL=https://barter.example.com
```

### 3.2. `client/.env`

| Variable           | Required | Example              | Description                                                                                                                                                                                                                                                                                         |
| ------------------ | -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`     | yes      | `/api`               | Base URL the client uses to call the API. With the bundled nginx reverse proxy, the relative path `/api` is the correct value; for split deployments use the full origin (e.g. `https://api.barter.example.com`). Note: this is a Vite **build-time** variable and is baked into the client bundle. |
| `SUPPORT_EMAIL`    | no       | `support@barter.dev` | Support contact email shown in the UI.                                                                                                                                                                                                                                                              |
| `SUPPORT_TELEGRAM` | no       | `@barter_support`    | Support Telegram handle shown in the UI.                                                                                                                                                                                                                                                            |

#### Example `client/.env`

```env
VITE_API_URL=/api
SUPPORT_EMAIL=support@barter.dev
SUPPORT_TELEGRAM=@barter_support
```

---

---

# BarterPlatform — Руководство по развёртыванию

Этот документ описывает, как развернуть и обновить BarterPlatform в
продакшн-окружении с использованием Docker и заранее собранных образов,
размещённых в GitHub Container Registry (GHCR).

Опубликованные образы **публичные**, поэтому токен доступа и шаг
`docker login` не требуются — образы скачиваются без авторизации.

---

## 1. Первичное развёртывание

Процедура ниже подготавливает чистую Linux-машину и впервые поднимает
приложение.

### 1.1. Предварительные требования

- Linux-VM с доступом по SSH и исходящим интернет-соединением.
- Файлы окружения для сервисов `server` и `client` (полное описание
  переменных — в разделе [3](#3-файлы-окружения)).

### 1.2. Установка Docker

Если Docker ещё не установлен, используйте официальный convenience-скрипт:

```bash
curl -fsSL https://get.docker.com | sh
```

### 1.3. Подготовка каталога проекта

Создайте каталог проекта и разместите в нём файлы по следующей структуре:

```
/barter
├── docker-compose.yml
├── server/.env
└── client/.env
```

- **`docker-compose.yml`** — используйте файл из
  [docker/docker-compose.prod.yml](https://github.com/DaveBullworth/BarterPlatform/blob/main/docker/docker-compose.yml).
- **`server/.env`** и **`client/.env`** — см. раздел
  [3](#3-файлы-окружения).

### 1.4. Получение образов

Образы в GHCR публичные, авторизация не нужна. Скачайте актуальные образы,
указанные в compose-файле:

```bash
docker compose -f docker-compose.yml pull
```

### 1.5. Запуск стека

Запустите приложение в фоновом режиме:

```bash
docker compose -f docker-compose.yml up -d
```

### 1.6. Проверка развёртывания

Убедитесь, что все контейнеры запущены:

```bash
docker ps
```

Все сервисы из compose-файла должны быть в статусе `Up`.

---

## 2. Обновление существующего развёртывания

Процедура обновления делится на ответственность разработчика и DevOps:
разработчики публикуют новые версии образов, DevOps выкатывают их на работающее
окружение.

### 2.1. Шаги разработчика

#### 2.1.1. Пересборка Docker-образов

Соберите образы `server` и `client`, проставив тег с новой версией:

```bash
docker build -t ghcr.io/davebullworth/barter-server:1.1 -f docker/Dockerfile.server .
docker build -t ghcr.io/davebullworth/barter-client:1.1 -f docker/Dockerfile.client .
```

#### 2.1.2. Публикация образов в GHCR

Запушьте пересобранные образы в реестр:

```bash
docker push ghcr.io/davebullworth/barter-server:1.1
docker push ghcr.io/davebullworth/barter-client:1.1
```

#### 2.1.3. Поднятие версии в `docker-compose.yml`

Обновите теги образов в compose-файле:

```yaml
server:
  image: ghcr.io/davebullworth/barter-server:1.1

client:
  image: ghcr.io/davebullworth/barter-client:1.1
```

Закоммитьте и запушьте изменение, чтобы обновлённый compose-файл стал доступен
DevOps.

### 2.2. Шаги DevOps

#### 2.2.1. Обновление `docker-compose.yml`

Подтяните последнюю версию `docker-compose.yml` на хост, чтобы новые теги
образов вступили в силу.

#### 2.2.2. Получение обновлённых образов

```bash
docker compose pull
```

#### 2.2.3. Перезапуск контейнеров

Пересоздайте контейнеры с новыми образами:

```bash
docker compose up -d
```

Проверьте развёртывание, как описано в разделе
[1.6](#16-проверка-развёртывания).

---

## 3. Файлы окружения

Стек читает конфигурацию из двух отдельных файлов: `server/.env`
(используется NestJS API и контейнером Postgres) и `client/.env`
(используется собранным через Vite React-клиентом). Оба файла должны
существовать до запуска стека — compose-файл подключает их через `env_file:`.

### 3.1. `server/.env`

#### Приложение

| Переменная | Обязательна | Пример       | Описание                                                                                                          |
| ---------- | ----------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| `PORT`     | да          | `3000`       | Порт, на котором поднимается NestJS-сервер внутри контейнера. Должен совпадать с пробросом портов в compose.      |
| `NODE_ENV` | да          | `production` | Режим работы. В развёрнутом окружении используйте `production`; влияет на `synchronize` в TypeORM и работу сидов. |
| `SEED`     | нет         | `true`       | При `true` запускает сид администратора на старте (создаёт начального админа, если его нет).                      |

#### Postgres

Эти значения читают и API (TypeORM), и контейнер `postgres` (через переменные
`POSTGRES_*` официального образа), поэтому они должны быть согласованы.

| Переменная          | Обязательна | Пример     | Описание                                                                |
| ------------------- | ----------- | ---------- | ----------------------------------------------------------------------- |
| `POSTGRES_HOST`     | да          | `postgres` | Хост Postgres. Указывайте имя сервиса из compose (`postgres`).          |
| `POSTGRES_PORT`     | да          | `5432`     | Порт Postgres.                                                          |
| `POSTGRES_USER`     | да          | `postgres` | Суперпользователь Postgres, под которым работает API.                   |
| `POSTGRES_PASSWORD` | да          | `postgres` | Пароль для `POSTGRES_USER`. В продакшене используйте надёжное значение. |
| `POSTGRES_DB`       | да          | `barter`   | Имя базы данных приложения.                                             |

#### Redis

| Переменная   | Обязательна | Пример  | Описание                                                 |
| ------------ | ----------- | ------- | -------------------------------------------------------- |
| `REDIS_HOST` | да          | `redis` | Хост Redis. Указывайте имя сервиса из compose (`redis`). |
| `REDIS_PORT` | да          | `6379`  | Порт Redis.                                              |

#### Начальный администратор (используется только при `SEED=true`)

| Переменная       | Обязательна | Пример               | Описание                                                       |
| ---------------- | ----------- | -------------------- | -------------------------------------------------------------- |
| `ADMIN_EMAIL`    | да          | `admin@barter.local` | Email сидового администратора.                                 |
| `ADMIN_LOGIN`    | да          | `admin`              | Логин сидового администратора.                                 |
| `ADMIN_NAME`     | да          | `Radion`             | Отображаемое имя сидового администратора.                      |
| `ADMIN_PASSWORD` | да          | `admin123`           | Начальный пароль администратора — смените после первого входа. |

#### Авторизация и сессии

| Переменная             | Обязательна | Пример                   | Описание                                                                        |
| ---------------------- | ----------- | ------------------------ | ------------------------------------------------------------------------------- |
| `ACCESS_TOKEN_SECRET`  | да          | длинная случайная строка | Секрет для подписи access-JWT. В продакшене — длинное случайное значение.       |
| `REFRESH_TOKEN_SECRET` | да          | длинная случайная строка | Секрет для подписи refresh-JWT. Должен отличаться от access-секрета.            |
| `MAX_SESSIONS`         | нет         | `3`                      | Максимум одновременных сессий на пользователя (по умолчанию `3`).               |
| `DEFAULT_PASSWORD`     | нет         | `default_password`       | Пароль по умолчанию, используемый в некоторых сценариях создания пользователей. |

#### Почта (SMTP)

Используется для подтверждения email и сброса пароля.

| Переменная       | Обязательна | Пример                       | Описание                                                                                       |
| ---------------- | ----------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `EMAIL_HOST`     | да          | `smtp.yandex.ru`             | Хост SMTP-сервера.                                                                             |
| `EMAIL_USERNAME` | да          | `noreply@yandex.by`          | SMTP-логин / адрес `From`.                                                                     |
| `EMAIL_PASSWORD` | да          | пароль приложения            | Пароль SMTP (используйте app-password, а не пароль аккаунта).                                  |
| `FRONTEND_URL`   | да          | `https://barter.example.com` | Публичный базовый URL клиента; подставляется в ссылки в письмах подтверждения и сброса пароля. |

#### Пример `server/.env`

```env
PORT=3000
NODE_ENV=production
SEED=true

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=barter

REDIS_HOST=redis
REDIS_PORT=6379

ADMIN_EMAIL=admin@barter.local
ADMIN_LOGIN=admin
ADMIN_NAME=Radion
ADMIN_PASSWORD=change-me

ACCESS_TOKEN_SECRET=replace-with-long-random-string
REFRESH_TOKEN_SECRET=replace-with-different-long-random-string
MAX_SESSIONS=3
DEFAULT_PASSWORD=default_password

EMAIL_HOST=smtp.yandex.ru
EMAIL_USERNAME=noreply@yandex.by
EMAIL_PASSWORD=app-specific-password
FRONTEND_URL=https://barter.example.com
```

### 3.2. `client/.env`

| Переменная         | Обязательна | Пример               | Описание                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ----------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`     | да          | `/api`               | Базовый URL, по которому клиент обращается к API. При использовании штатного nginx-прокси корректное значение — относительный путь `/api`; при разнесённом деплое укажите полный origin (например, `https://api.barter.example.com`). Внимание: это **build-time** переменная Vite, она вшивается в бандл клиента при сборке. |
| `SUPPORT_EMAIL`    | нет         | `support@barter.dev` | Email поддержки, отображаемый в интерфейсе.                                                                                                                                                                                                                                                                                   |
| `SUPPORT_TELEGRAM` | нет         | `@barter_support`    | Telegram-контакт поддержки, отображаемый в интерфейсе.                                                                                                                                                                                                                                                                        |

#### Пример `client/.env`

```env
VITE_API_URL=/api
SUPPORT_EMAIL=support@barter.dev
SUPPORT_TELEGRAM=@barter_support
```
