# BarterPlatform — Client (English)

Frontend of the barter platform. Stack: **React 18 + TypeScript + Vite**, **Mantine** for UI, **TanStack Query** for server state, **Redux Toolkit** for client state (minimal — auth + rate-limit), **react-router-dom** for routing, **i18next** for localization, **Zod** for validation.

The project follows the **Feature-Sliced Design (FSD)** architecture.

---

## What FSD is and why we use it

**Feature-Sliced Design** is a methodology for organizing frontend code. Its core idea: split the code into horizontal **layers**, where each layer has a fixed level of abstraction, and dependencies between layers flow **only top-down**.

### Layer hierarchy (from high to low level)

```
app       ←  Application composition: providers, store, router, i18n bootstrap
pages     ←  Route entry points (thin, orchestrate widgets)
widgets   ←  Self-contained UI blocks (header, profile card, lot form)
features  ←  User actions + their business logic (login, edit, submit)
entities  ←  Domain entities (Lot, User, Taxonomy, Geography)
shared    ←  Reusable primitives without domain knowledge (UI kit, utils, api client)
```

**Main rule: a module in layer X may only import from layer X and below.**
`features` may import from `entities` and `shared`, but not from `widgets` / `pages` / `app`. `entities` — only from `shared`. `shared` knows nothing about anyone.

This rule is the foundation of the architecture. Any "upward" import instantly breaks it.

### Slices within a layer

Inside each layer (except `app` and `shared`) the code is split into **slices** — independent folders by domain area. For example, `entities/` contains slices `lot/`, `user/`, `geography/`, `taxonomy/`. By default, slices on the same layer **must not import each other** (the only allowed exception is cross-imports through the public API, when truly needed).

Inside a slice — **segments** by technical purpose: `model.ts` (types and domain logic), `api.ts` (queries), `lib.ts` (utilities), `ui/` (React components), `index.ts` (Public API).

### Public API

Every slice exposes itself through `index.ts` — its **Public API**. Importing into the slice's internals (bypassing `index.ts`) is discouraged: external code should only see what the slice chooses to expose.

```ts
// ✓ good
import { useLot, type Lot } from '@/entities/lot';

// ✗ bad — bypasses public API
import { useLot } from '@/entities/lot/api';
```

### Why bother

- **Transparent dependencies.** The layer name immediately tells you what may depend on what. The import graph never turns into spaghetti.
- **Local changes.** Editing the lot form means touching `widgets/LotForm` and `features/lot-form`. No fear that an entity will break.
- **Reusability.** `entities/lot/ui/LotImagesCarousel` can be dropped on any page because it knows nothing about features or widgets.
- **Scalability.** A new developer understands where to put code after a 5-minute explanation of the rules.
- **Testability.** Lower layers (`shared`, `entities`) are pure and easy to unit-test.

---

## Project structure

```
client/src/
├── app/                              # Application initialization
│   ├── App.tsx                       # Root component → AppProvider
│   ├── main.tsx                      # ReactDOM.render + provider order
│   ├── providers/
│   │   ├── AppProvider.tsx           # AuthBootstrap + RouterProvider
│   │   ├── ApiProvider.tsx           # Axios configuration (rate-limit, logout)
│   │   ├── AuthBootstrap.tsx         # Loads self-user on startup
│   │   ├── MantineProvider.tsx       # Mantine theme
│   │   ├── QueryProvider.tsx         # TanStack Query client
│   │   └── RouterProvider.tsx        # BrowserRouter
│   ├── router/
│   │   ├── routes.tsx                # All application routes
│   │   └── guards/
│   │       ├── RequireAuth.tsx
│   │       └── RequireAdmin.tsx
│   ├── store/
│   │   └── index.ts                  # configureStore — composes reducers from entities
│   ├── i18n/
│   │   ├── index.ts                  # i18next.init(...) — single point
│   │   ├── resources.ts
│   │   └── locales/                  # ru.json, en.json, pl.json, de.json
│   └── styles/
│       ├── globals.scss
│       ├── variables.scss
│       └── Mantine.module.scss
│
├── pages/                            # Thin pages — orchestrate widgets
│   ├── admin/AdminPage.tsx
│   ├── auth/AuthPage.tsx
│   ├── feed/FeedPage.tsx
│   ├── lot/LotPage.tsx
│   ├── lot-form/LotFormPage.tsx
│   ├── mail-confirm/MailConfirmPage.tsx
│   ├── my-lots/MyLotsPage.tsx
│   ├── profile/ProfilePage.tsx
│   └── reset-password/ResetPasswordPage.tsx
│
├── widgets/                          # Composite UI blocks
│   ├── AppShell/                     # Layout shell (header + navbar + outlet)
│   ├── AppHeader/                    # Top bar + DesktopHeader/MobileHeader
│   ├── AppNavbar/                    # Side / bottom navigation
│   ├── LotsFeed/                     # Lot feed with filters and pagination
│   ├── LotForm/                      # Lot create/edit form
│   │   ├── LotForm.tsx
│   │   ├── LotFormHeader.tsx
│   │   └── sections/                 # GeoSection, ImagesSection, BasicInfoSection
│   ├── LotActions/                   # Lot actions menu (on the view page)
│   ├── ProfileHeaderBlock/           # Profile header with avatar
│   ├── ProfileContactsBlock/         # Contacts card
│   └── ProfilePreferencesBlock/      # User preferences card
│
├── features/                         # User actions and their logic
│   ├── auth/
│   │   ├── login/                    # useLogin
│   │   ├── register/                 # RegisterForm + useRegister
│   │   ├── logout/                   # useLogout
│   │   ├── forgot-password/          # useForgotPassword
│   │   ├── reset-password/           # useResetPassword
│   │   ├── resend-confirm/           # ResendConfirmEmailAction
│   │   ├── bootstrap/                # useBootstrap, useApplyUserSession
│   │   └── auth-required/            # AuthRequired guard wrapper
│   ├── admin/
│   │   ├── columns/                  # userColumns for the table
│   │   ├── filters/                  # AdminTableFilters + useAdminFilters
│   │   └── table/                    # AdminTable, useTableSorting, useColumnSizing
│   ├── lot-form/                     # Business logic of lot create/edit
│   │   ├── model.ts                  # LotFormValues, EMPTY_LOT_FORM, MAX_LOT_IMAGES
│   │   ├── useLotFormData.ts         # Loads lot for edit mode
│   │   ├── useLotFormState.ts        # mantine/form state
│   │   ├── useLotImages.ts           # Image management (add/remove/primary)
│   │   └── useLotSubmit.ts           # Save
│   ├── lot-status/                   # Lot status change (archive/unarchive)
│   ├── category-filter/              # Category filter (drawer + selection)
│   ├── geo-filter/                   # Geo filter (region/city/district)
│   ├── search-filter/                # Text search
│   └── profile/
│       ├── edit/                     # ProfileEditModal + useProfileEdit
│       ├── avatar/                   # AvatarEditModal + useAvatar
│       └── deactivation/             # AccountDeactivationModal + useDeactivation
│
├── entities/                         # Domain entities
│   ├── lot/
│   │   ├── api.ts                    # useLot, useLots, useLotImages, lotKeys, lotApi
│   │   ├── model.ts                  # Lot, LotImage, LotResponse, LOT_STATUS
│   │   ├── lib.ts                    # buildLotFilters, isLotArchived, getLotStatusMeta
│   │   ├── ui/
│   │   │   ├── LotImagesCarousel.tsx
│   │   │   ├── LotDescription.tsx
│   │   │   ├── LotLocation.tsx
│   │   │   ├── LotQuantity.tsx
│   │   │   └── LotStatusDates.tsx
│   │   └── index.ts                  # Public API
│   ├── user/
│   │   ├── api.ts                    # useSelfUser, useUserById, userApi, userKeys
│   │   ├── model.ts                  # SelfUser, AdminUser, AnyUser, isSelfUser, ...
│   │   ├── lib.ts                    # resolveProfileMode, getUserAvatarUrl
│   │   ├── store.ts                  # auth slice + useAuthStore (locally typed)
│   │   └── index.ts
│   ├── taxonomy/
│   │   ├── api.ts                    # useTaxonomy, taxonomyKeys
│   │   ├── model.ts                  # Chapter, Category, Subcategory, CategorySelection
│   │   ├── lib.ts                    # resolveTaxonomyPath, resolveBreadcrumbs
│   │   ├── ui/
│   │   │   ├── TaxonomyTree.tsx      # Base category-tree renderer
│   │   │   ├── TaxonomySection.tsx   # Composite — card with selection modal
│   │   │   ├── CategoriesSkeleton.tsx
│   │   │   └── items/                # CategoryItem, ChapterItem, SubcategoryItem
│   │   └── index.ts
│   ├── geography/
│   │   ├── api.ts                    # useRegionOptions, useCityOptions, useDistrictOptions
│   │   ├── model.ts                  # GeoSelectOption, GeoValue, Region, City
│   │   ├── lib.ts
│   │   ├── ui/
│   │   │   └── GeoSelector.tsx       # region → city → district cascade
│   │   └── index.ts
│   └── rate-limit/                   # System state for network rate limits
│       ├── model.ts                  # RateLimitState
│       ├── store.ts                  # rateLimitSlice + useRateLimit hook
│       └── index.ts
│
└── shared/                           # Reusable primitives — no domain knowledge
    ├── api/
    │   ├── client.ts                 # axios instance + configureApiClient
    │   ├── interceptors/             # auth, language, rateLimit
    │   ├── types.ts
    │   └── index.ts
    ├── ui/                           # Generic UI without business meaning
    │   ├── ConfirmModal.tsx
    │   ├── ErrorStub.tsx
    │   ├── FullPageLoader.tsx
    │   ├── DateRangeDropdownInput.tsx
    │   ├── PhoneInput.tsx
    │   ├── LanguageSwitcher.tsx
    │   └── ThemeSwitcher.tsx
    ├── lib/
    │   ├── navigation/               # useNavigation hook (typed routes)
    │   ├── notify/                   # wrapper around Mantine notifications
    │   ├── validators/               # generic zod schemas
    │   ├── formatters/               # date/number formatting
    │   ├── filters/                  # filter serialization
    │   ├── geoFilter/
    │   ├── alertPresets/
    │   ├── errorHandler/             # getApiErrorStatusCode, etc.
    │   ├── etag/
    │   ├── utils/
    │   └── index.ts
    └── constants/                    # ROUTES, USER_ROLES, USER_LANGUAGES, ...
```

---

## Layers in detail

### `app/` — composition and initialization

What lives here, **and only here**:

- The root `App.tsx` and `main.tsx` (React entry points).
- **Providers** — Mantine, ReactQuery, Redux, Router, Api initialization.
- **Router** — route definitions and guards (`RequireAuth`, `RequireAdmin`).
- **Redux store** — `configureStore`, which composes reducers from `entities/*/store.ts`. `RootState` is defined only here.
- **i18n bootstrap** — `i18next.init(...)`, translation resources, locales.
- **Global styles** — `globals.scss`, `variables.scss`.

Rule: app **contains no business logic**. Only module composition.

```ts
// app/store/index.ts — composes reducers from entities
import authReducer from '@/entities/user/store';
import { rateLimitSlice } from '@/entities/rate-limit';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rateLimit: rateLimitSlice.reducer,
  },
});
```

### `pages/` — thin pages

A page = a route entry point. Its job is to **orchestrate** components from lower layers and pass them parameters from the URL.

Example — [pages/lot/LotPage.tsx](src/pages/lot/LotPage.tsx) (~100 lines, the rest lives in widgets and entities):

```ts
export const LotPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: lot } = useLot(id);                 // entities/lot
  const { data: images = [] } = useLotImages(id);   // entities/lot

  // ...
  return (
    <Stack>
      <LotImagesCarousel images={images} />        {/* entities/lot/ui */}
      <LotDescription description={...} />          {/* entities/lot/ui */}
      <LotLocation .../>                             {/* entities/lot/ui */}
      <LotActions lot={lot} actions={actions} />    {/* widgets/LotActions */}
    </Stack>
  );
};
```

No own business logic, no forms, no modals directly inside pages — everything lives in widgets/features/entities.

### `widgets/` — composite UI blocks

A widget = a **self-contained UI fragment** assembled from features and entities. May be reused on several pages.

Examples from the project:

- **`AppShell`** — layout shell, combines `AppHeader` + `AppNavbar` + `<Outlet />`.
- **`AppHeader`** — top bar with logo, search, theme/language switchers, user menu.
- **`AppNavbar`** — navigation (Desktop sidebar / Mobile bottom).
- **`LotsFeed`** — lot feed with filters, pagination, grid/list toggle. Composes `useLots` (entity) + `useCategorySelection` / `useGeoFilter` / `useSearchQuery` (features).
- **`LotForm`** — large lot create/edit form. Receives form state and handlers from `features/lot-form` (business logic) and just renders the UI.
- **`LotActions`** — actions menu on the lot view page. Composes the `lot-status` feature.
- **`ProfileHeaderBlock` / `ProfileContactsBlock` / `ProfilePreferencesBlock`** — profile page blocks. Used on the profile page; could potentially appear in admin too.

**How a widget differs from a feature**, when both contain UI? A widget is a **ready-made page block**, a feature is a **user action** (usually a small UI trigger + business logic). If a component does nothing on its own and only displays data with the option to launch a feature — it's a widget.

### `features/` — user actions

A feature = **one specific user action** + its related logic. In our project a feature most often consists of:

- A **hook** with the business logic (`useLogin`, `useLotSubmit`, `useDeactivation`).
- A **small UI trigger** (modal, button wrapper, form) — when needed.

For example, `features/lot-form/`:

```
lot-form/
├── model.ts            # LotFormValues, EMPTY_LOT_FORM, MAX_LOT_IMAGES
├── useLotFormData.ts   # loading the lot for edit mode
├── useLotFormState.ts  # @mantine/form state machine
├── useLotImages.ts     # image array management
├── useLotSubmit.ts     # POST/PATCH + cache invalidation
└── index.ts            # Public API
```

There is **no UI here** — only hooks and the model. The corresponding UI (form) lives in `widgets/LotForm/`. This is an intentional split: business logic separately, UI composition separately.

Another example — `features/profile/edit/`:

```
edit/
├── ProfileEditModal.tsx   # modal wrapper
├── ProfileEditForm.tsx    # form inside the modal
├── useProfileEdit.ts      # submit + cache
└── index.ts
```

Here the UI trigger lives next to the logic because the modal is small and tied only to this action.

### `entities/` — domain entities

An entity = a **basic business unit** of the application. We have five entities:

- **`lot`** — Lot (item to barter). Contains the model, API hooks (`useLot`, `useLots`, `useLotImages`), domain functions (`buildLotFilters`, `isLotArchived`, `getLotStatusMeta`) and presentational UI components (`LotImagesCarousel`, `LotLocation`, `LotStatusDates`, etc. — those that just render lot fields without logic).
- **`user`** — User. Includes the Redux `authSlice` (minimal — id and role for guards) with the locally typed `useAuthStore` hook (no reverse import of `RootState`).
- **`taxonomy`** — Category tree (Chapter → Category → Subcategory). Contains `TaxonomyTree`, `TaxonomySection`, `SubcategoryItem`, `CategoriesSkeleton` — all presentational components of the tree. Consumed by `features/category-filter/CategoriesDrawer` and `widgets/LotForm`.
- **`geography`** — Regions / cities / districts. The cascading `GeoSelector` lives here too.
- **`rate-limit`** — System state for network rate limits (`429 Too Many Requests`). Slice + `useRateLimit` hook. This is a "system" entity rather than a business one — but in FSD an entity may represent any global state, not only a business object.

Each entity has the same anatomy:

```
entity-name/
├── model.ts    # types, constants, validators
├── api.ts      # query hooks, query keys, raw API functions
├── lib.ts      # domain utils (buildXFilters, isXArchived, ...)
├── ui/         # presentational components of the entity (optional)
├── store.ts    # Redux slice (optional)
└── index.ts    # Public API
```

**UI in entities is presentational only.** `LotImagesCarousel` takes `images` and renders a carousel. No business logic, no action modals, no imports from features.

### `shared/` — the foundation

Shared = **universal code without domain knowledge**. You can't put `LotCard` here because Lot is a domain, and the card belongs in `entities/lot/ui/`. You can put `<ConfirmModal>` here because it's an abstract confirmation modal.

- **`shared/api`** — axios instance, interceptors (auth, language, rateLimit), ApiError types. Transport only, no resource knowledge.
- **`shared/ui`** — UI kit without domain: `ConfirmModal`, `ErrorStub`, `PhoneInput`, `LanguageSwitcher`, `ThemeSwitcher`.
- **`shared/lib`** — utilities: `useNavigation` (typed wrapper around `react-router`), `notify`, `validators`, `formatters`, `errorHandler`.
- **`shared/constants`** — constants: `ROUTES`, `USER_ROLES`, `USER_LANGUAGES`.

**Hard rule: shared imports from no layer.** If `import { Lot } from '@/entities/lot'` shows up inside shared — that's a signal the component should move to that entity.

---

## Dependency graph in real code

```
                     ┌───────┐
                     │  app  │   ← composition root, store, providers, router
                     └───┬───┘
                         │
                     ┌───▼───┐
                     │ pages │   ← thin pages: orchestrate widgets/entities
                     └───┬───┘
                         │
                     ┌───▼─────┐
                     │ widgets │   ← composite UI blocks
                     └───┬─────┘
                         │
                     ┌───▼──────┐
                     │ features │   ← user actions + business logic
                     └───┬──────┘
                         │
                     ┌───▼──────┐
                     │ entities │   ← domain models, queries, slice stores
                     └───┬──────┘
                         │
                     ┌───▼─────┐
                     │ shared  │   ← primitives, no domain knowledge
                     └─────────┘
```

A **downward** arrow = "may import". There are no upward arrows between layers.

---

## Where to put new code

A cheat sheet — ask these 4 questions in order:

1. **Is it about a specific domain?** If yes — continue; if no (a generic primitive) → `shared/`.
2. **Is it just rendering of a domain entity's fields, or a basic operation on one (query, domain helper)?** → `entities/<domain>/`.
3. **Is it a specific user action (login, edit, submit, deactivate)?** → `features/<action>/`.
4. **Is it a composite UI block assembled from several features/entities and embedded into a page?** → `widgets/<block>/`.

If nothing fits and it's a new page — `pages/<page>/`. If it's the initialization of the whole app — `app/`.

### Import order template for new files

```ts
// 1) External packages
import { useState } from 'react';
import { Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// 2) Layers top-down via @/...
import { useLot } from '@/entities/lot';
import { useNavigation } from '@/shared/lib/navigation';
import { ConfirmModal } from '@/shared/ui';

// 3) Local imports of the current slice
import { useLotFormData } from './useLotFormData';
import type { LotFormValues } from './model';
```

---

## Running

```bash
cd client
npm install
npm run dev
```

Stack:

| What            | Library                            |
| --------------- | ---------------------------------- |
| Server requests | `@tanstack/react-query`            |
| Client state    | `@reduxjs/toolkit` (minimal)       |
| Forms           | `@mantine/form`                    |
| Validation      | `zod`                              |
| Routing         | `react-router-dom` v6              |
| UI              | `@mantine/core` + `@mantine/hooks` |
| Localization    | `i18next` + `react-i18next`        |
| HTTP            | `axios`                            |
| Icons           | `lucide-react`                     |
| Bundler         | `vite`                             |

---

# BarterPlatform — Client

Фронтенд платформы обмена лотами. Стек: **React 18 + TypeScript + Vite**, **Mantine** для UI, **TanStack Query** для серверного состояния, **Redux Toolkit** для клиентского стейта (минимум — auth + rate-limit), **react-router-dom** для навигации, **i18next** для локализации, **Zod** для валидации.

Проект построен по архитектуре **Feature-Sliced Design (FSD)**.

---

## Что такое FSD и зачем он

**Feature-Sliced Design** — это методология организации фронтенд-кода. Главная идея — разделить код на горизонтальные **слои** (layers), где каждый слой имеет фиксированный уровень абстракции, и зависимости между слоями идут **только сверху вниз**.

### Иерархия слоёв (от высокого уровня к низкому)

```
app       ←  Композиция приложения, провайдеры, store, router, i18n bootstrap
pages     ←  Страницы-точки входа маршрутов (тонкие, оркестрируют widgets)
widgets   ←  Самодостаточные блоки UI (header, шапка профиля, форма лота)
features  ←  Пользовательские действия + их бизнес-логика (логин, редактирование)
entities  ←  Доменные сущности (Lot, User, Taxonomy, Geography)
shared    ←  Переиспользуемые примитивы без знаний о домене (UI-кит, утилиты, api-клиент)
```

**Главное правило: модуль слоя X может импортить только из слоёв X-и-ниже.**
`features` может импортить из `entities` и `shared`, но не из `widgets`/`pages`/`app`. `entities` — только из `shared`. `shared` ничего не знает ни о ком.

Это правило — фундамент архитектуры. Любой импорт «вверх» по слоям мгновенно ломает её.

### Внутри слоя — slices

Внутри каждого слоя (кроме `app` и `shared`) код делится на **slices** — независимые папки по доменной области. Например, в `entities/` есть slices `lot/`, `user/`, `geography/`, `taxonomy/`. Slices одного слоя по умолчанию **не должны импортить друг друга** (исключение — cross-imports через публичный API при необходимости).

Внутри slice — **segments** по техническому назначению: `model.ts` (типы и доменная логика), `api.ts` (запросы), `lib.ts` (утилиты), `ui/` (React-компоненты), `index.ts` (Public API).

### Public API

Каждый slice экспортирует наружу через `index.ts` — это его **Public API**. Импорты внутрь slice (мимо index) нежелательны: внешний код должен видеть только то, что слайс хочет показать.

```ts
// ✓ хорошо
import { useLot, type Lot } from '@/entities/lot';

// ✗ плохо — обход public API
import { useLot } from '@/entities/lot/api';
```

### Зачем всё это

- **Прозрачные зависимости.** По имени слоя сразу понятно, что от чего может зависеть. Граф импортов не превращается в спагетти.
- **Локальные изменения.** Меняешь форму лота — трогаешь `widgets/LotForm` и `features/lot-form`. Не нужно бояться, что entity сломается.
- **Переиспользуемость.** `entities/lot/ui/LotImagesCarousel` можно вставить в любую страницу, потому что он не знает ни про features, ни про widgets.
- **Масштабируемость.** Новый разработчик понимает, куда положить код, по 5-минутному объяснению правил.
- **Тестируемость.** Слои внизу (`shared`, `entities`) — чистые, их легко юнит-тестировать.

---

## Структура проекта

```
client/src/
├── app/                              # Инициализация приложения
│   ├── App.tsx                       # Корневой компонент → AppProvider
│   ├── main.tsx                      # ReactDOM.render + порядок провайдеров
│   ├── providers/
│   │   ├── AppProvider.tsx           # AuthBootstrap + RouterProvider
│   │   ├── ApiProvider.tsx           # Конфигурация axios (rate-limit, logout)
│   │   ├── AuthBootstrap.tsx         # Загрузка self-юзера при старте
│   │   ├── MantineProvider.tsx       # Тема Mantine
│   │   ├── QueryProvider.tsx         # TanStack Query client
│   │   └── RouterProvider.tsx        # BrowserRouter
│   ├── router/
│   │   ├── routes.tsx                # Все маршруты приложения
│   │   └── guards/
│   │       ├── RequireAuth.tsx
│   │       └── RequireAdmin.tsx
│   ├── store/
│   │   └── index.ts                  # configureStore — собирает редюсеры из entities
│   ├── i18n/
│   │   ├── index.ts                  # i18next.init(...) — single point
│   │   ├── resources.ts
│   │   └── locales/                  # ru.json, en.json, pl.json, de.json
│   └── styles/
│       ├── globals.scss
│       ├── variables.scss
│       └── Mantine.module.scss
│
├── pages/                            # Тонкие страницы — оркестрируют widgets
│   ├── admin/AdminPage.tsx
│   ├── auth/AuthPage.tsx
│   ├── feed/FeedPage.tsx
│   ├── lot/LotPage.tsx
│   ├── lot-form/LotFormPage.tsx
│   ├── mail-confirm/MailConfirmPage.tsx
│   ├── my-lots/MyLotsPage.tsx
│   ├── profile/ProfilePage.tsx
│   └── reset-password/ResetPasswordPage.tsx
│
├── widgets/                          # Композитные блоки UI
│   ├── AppShell/                     # Каркас layout (header + navbar + outlet)
│   ├── AppHeader/                    # Верхняя панель + DesktopHeader/MobileHeader
│   ├── AppNavbar/                    # Боковая/нижняя навигация
│   ├── LotsFeed/                     # Лента лотов с фильтрами и пагинацией
│   ├── LotForm/                      # Форма создания/редактирования лота
│   │   ├── LotForm.tsx
│   │   ├── LotFormHeader.tsx
│   │   └── sections/                 # GeoSection, ImagesSection, BasicInfoSection
│   ├── LotActions/                   # Меню действий с лотом (на странице просмотра)
│   ├── ProfileHeaderBlock/           # Заголовок профиля с аватаркой
│   ├── ProfileContactsBlock/         # Карточка контактов
│   └── ProfilePreferencesBlock/      # Карточка настроек юзера
│
├── features/                         # Пользовательские действия и их логика
│   ├── auth/
│   │   ├── login/                    # useLogin
│   │   ├── register/                 # RegisterForm + useRegister
│   │   ├── logout/                   # useLogout
│   │   ├── forgot-password/          # useForgotPassword
│   │   ├── reset-password/           # useResetPassword
│   │   ├── resend-confirm/           # ResendConfirmEmailAction
│   │   ├── bootstrap/                # useBootstrap, useApplyUserSession
│   │   └── auth-required/            # AuthRequired guard-обёртка
│   ├── admin/
│   │   ├── columns/                  # userColumns для таблицы
│   │   ├── filters/                  # AdminTableFilters + useAdminFilters
│   │   └── table/                    # AdminTable, useTableSorting, useColumnSizing
│   ├── lot-form/                     # Бизнес-логика создания/редактирования лота
│   │   ├── model.ts                  # LotFormValues, EMPTY_LOT_FORM, MAX_LOT_IMAGES
│   │   ├── useLotFormData.ts         # Загрузка лота для edit-режима
│   │   ├── useLotFormState.ts        # mantine/form state
│   │   ├── useLotImages.ts           # Управление изображениями (add/remove/primary)
│   │   └── useLotSubmit.ts           # Сохранение
│   ├── lot-status/                   # Изменение статуса лота (archive/unarchive)
│   ├── category-filter/              # Фильтр по категориям (drawer + selection)
│   ├── geo-filter/                   # Фильтр по гео (region/city/district)
│   ├── search-filter/                # Поиск по тексту
│   └── profile/
│       ├── edit/                     # ProfileEditModal + useProfileEdit
│       ├── avatar/                   # AvatarEditModal + useAvatar
│       └── deactivation/             # AccountDeactivationModal + useDeactivation
│
├── entities/                         # Доменные сущности
│   ├── lot/
│   │   ├── api.ts                    # useLot, useLots, useLotImages, lotKeys, lotApi
│   │   ├── model.ts                  # Lot, LotImage, LotResponse, LOT_STATUS
│   │   ├── lib.ts                    # buildLotFilters, isLotArchived, getLotStatusMeta
│   │   ├── ui/
│   │   │   ├── LotImagesCarousel.tsx
│   │   │   ├── LotDescription.tsx
│   │   │   ├── LotLocation.tsx
│   │   │   ├── LotQuantity.tsx
│   │   │   └── LotStatusDates.tsx
│   │   └── index.ts                  # Public API
│   ├── user/
│   │   ├── api.ts                    # useSelfUser, useUserById, userApi, userKeys
│   │   ├── model.ts                  # SelfUser, AdminUser, AnyUser, isSelfUser, ...
│   │   ├── lib.ts                    # resolveProfileMode, getUserAvatarUrl
│   │   ├── store.ts                  # auth slice + useAuthStore (локальная типизация)
│   │   └── index.ts
│   ├── taxonomy/
│   │   ├── api.ts                    # useTaxonomy, taxonomyKeys
│   │   ├── model.ts                  # Chapter, Category, Subcategory, CategorySelection
│   │   ├── lib.ts                    # resolveTaxonomyPath, resolveBreadcrumbs
│   │   ├── ui/
│   │   │   ├── TaxonomyTree.tsx      # Базовый рендер дерева категорий
│   │   │   ├── TaxonomySection.tsx   # Composite — карточка с модалкой выбора
│   │   │   ├── CategoriesSkeleton.tsx
│   │   │   └── items/                # CategoryItem, ChapterItem, SubcategoryItem
│   │   └── index.ts
│   ├── geography/
│   │   ├── api.ts                    # useRegionOptions, useCityOptions, useDistrictOptions
│   │   ├── model.ts                  # GeoSelectOption, GeoValue, Region, City
│   │   ├── lib.ts
│   │   ├── ui/
│   │   │   └── GeoSelector.tsx       # Каскад region → city → district
│   │   └── index.ts
│   └── rate-limit/                   # Системное состояние сетевых лимитов
│       ├── model.ts                  # RateLimitState
│       ├── store.ts                  # rateLimitSlice + useRateLimit hook
│       └── index.ts
│
└── shared/                           # Переиспользуемые примитивы — без знания о домене
    ├── api/
    │   ├── client.ts                 # axios instance + configureApiClient
    │   ├── interceptors/             # auth, language, rateLimit
    │   ├── types.ts
    │   └── index.ts
    ├── ui/                           # Универсальные UI без бизнес-смысла
    │   ├── ConfirmModal.tsx
    │   ├── ErrorStub.tsx
    │   ├── FullPageLoader.tsx
    │   ├── DateRangeDropdownInput.tsx
    │   ├── PhoneInput.tsx
    │   ├── LanguageSwitcher.tsx
    │   └── ThemeSwitcher.tsx
    ├── lib/
    │   ├── navigation/               # useNavigation hook (типизированные роуты)
    │   ├── notify/                   # обёртка над Mantine notifications
    │   ├── validators/               # zod-схемы общего назначения
    │   ├── formatters/               # форматирование дат/чисел
    │   ├── filters/                  # сериализация фильтров
    │   ├── geoFilter/
    │   ├── alertPresets/
    │   ├── errorHandler/             # getApiErrorStatusCode и т.п.
    │   ├── etag/
    │   ├── utils/
    │   └── index.ts
    └── constants/                    # ROUTES, USER_ROLES, USER_LANGUAGES, ...
```

---

## Слои в деталях

### `app/` — композиция и инициализация

Что лежит здесь и **только здесь**:

- Корневой `App.tsx` и `main.tsx` (точки входа React).
- **Провайдеры** — Mantine, ReactQuery, Redux, Router, Api-инициализация.
- **Router** — определение маршрутов и guards (`RequireAuth`, `RequireAdmin`).
- **Redux store** — `configureStore`, который собирает редюсеры из `entities/*/store.ts`. Только здесь определяется `RootState`.
- **i18n bootstrap** — `i18next.init(...)`, ресурсы переводов, locales.
- **Глобальные стили** — `globals.scss`, `variables.scss`.

Правило: app **не содержит** бизнес-логики. Только сборка модулей.

```ts
// app/store/index.ts — собирает редюсеры из entities
import authReducer from '@/entities/user/store';
import { rateLimitSlice } from '@/entities/rate-limit';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rateLimit: rateLimitSlice.reducer,
  },
});
```

### `pages/` — тонкие страницы

Страница = точка входа маршрута. Её работа — **оркестрировать** компоненты с нижних слоёв и пробросить им параметры из URL.

Пример — [pages/lot/LotPage.tsx](src/pages/lot/LotPage.tsx) (~100 строк, остальное — в widgets и entities):

```ts
export const LotPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: lot } = useLot(id);                 // entities/lot
  const { data: images = [] } = useLotImages(id);   // entities/lot

  // ...
  return (
    <Stack>
      <LotImagesCarousel images={images} />        {/* entities/lot/ui */}
      <LotDescription description={...} />          {/* entities/lot/ui */}
      <LotLocation .../>                             {/* entities/lot/ui */}
      <LotActions lot={lot} actions={actions} />    {/* widgets/LotActions */}
    </Stack>
  );
};
```

Никакой собственной бизнес-логики, никаких форм, никаких модалок прямо в pages — всё в widgets/features/entities.

### `widgets/` — композитные блоки UI

Widget = **самодостаточный фрагмент интерфейса**, который собирается из features и entities. Может быть переиспользован на нескольких страницах.

Примеры из проекта:

- **`AppShell`** — каркас layout, объединяет `AppHeader` + `AppNavbar` + `<Outlet />`.
- **`AppHeader`** — шапка с логотипом, поиском, переключателями темы/языка, меню юзера.
- **`AppNavbar`** — навигация (Desktop sidebar / Mobile bottom).
- **`LotsFeed`** — лента лотов с фильтрами, пагинацией, переключением grid/list. Композирует `useLots` (entity) + `useCategorySelection`/`useGeoFilter`/`useSearchQuery` (features).
- **`LotForm`** — большая форма создания/редактирования лота. Принимает форму и хендлеры из `features/lot-form` (бизнес-логика) и просто рисует UI.
- **`LotActions`** — меню действий на странице просмотра лота. Композирует feature `lot-status`.
- **`ProfileHeaderBlock` / `ProfileContactsBlock` / `ProfilePreferencesBlock`** — блоки страницы профиля. Используются на странице, могут потенциально показываться в админке.

**Чем widget отличается от feature**, если оба содержат UI? Widget — это **готовый блок страницы**, feature — это **действие пользователя** (как правило, маленький UI-триггер + бизнес-логика). Если компонент сам по себе ничего не «делает», а только показывает данные с возможностью запустить feature — это widget.

### `features/` — пользовательские действия

Feature = **одно конкретное действие пользователя** + связанная с ним логика. В нашем проекте feature чаще всего состоит из:

- **Hook** с бизнес-логикой (`useLogin`, `useLotSubmit`, `useDeactivation`)
- **Маленький UI-триггер** (модалка, кнопка-обёртка, форма) — если нужен

Например, `features/lot-form/`:

```
lot-form/
├── model.ts            # LotFormValues, EMPTY_LOT_FORM, MAX_LOT_IMAGES
├── useLotFormData.ts   # загрузка лота для редактирования
├── useLotFormState.ts  # @mantine/form state-машина
├── useLotImages.ts     # управление массивом изображений
├── useLotSubmit.ts     # POST/PATCH + invalidation кеша
└── index.ts            # Public API
```

Здесь **нет UI** — все хуки и модель. Соответствующий UI (форма) живёт в `widgets/LotForm/`. Это умышленный split: бизнес-логика отдельно, композиция UI отдельно.

Другой пример — `features/profile/edit/`:

```
edit/
├── ProfileEditModal.tsx   # модалка-обёртка
├── ProfileEditForm.tsx    # форма внутри модалки
├── useProfileEdit.ts      # submit + кеш
└── index.ts
```

Тут UI-триггер живёт рядом с логикой, потому что модалка маленькая и завязана только на это действие.

### `entities/` — доменные сущности

Entity — **базовая бизнес-единица** приложения. У нас пять сущностей:

- **`lot`** — Лот (товар на обмен). Содержит модель, API-хуки (`useLot`, `useLots`, `useLotImages`), доменные функции (`buildLotFilters`, `isLotArchived`, `getLotStatusMeta`) и презентационные UI-компоненты (`LotImagesCarousel`, `LotLocation`, `LotStatusDates` и т.д. — те, что просто отображают свойства лота без логики).
- **`user`** — Пользователь. Включает Redux slice `authSlice` (минимум — id и роль для guards) с локально типизированным `useAuthStore` (без обратного импорта `RootState`).
- **`taxonomy`** — Дерево категорий (Chapter → Category → Subcategory). Содержит `TaxonomyTree`, `TaxonomySection`, `SubcategoryItem`, `CategoriesSkeleton` — все презентационные компоненты дерева. Их потребляют `features/category-filter/CategoriesDrawer` и `widgets/LotForm`.
- **`geography`** — Регионы / города / районы. Каскадный селектор `GeoSelector` тоже здесь.
- **`rate-limit`** — Системное состояние сетевых лимитов (`429 Too Many Requests`). Slice + хук `useRateLimit`. Это «система»-entity, а не доменная — но в FSD entity может представлять любое глобальное состояние, не только бизнес-сущность.

Каждое entity имеет одинаковую анатомию:

```
entity-name/
├── model.ts    # типы, константы, валидаторы
├── api.ts      # query-хуки, query keys, raw API-функции
├── lib.ts     # доменные утилиты (buildXFilters, isXArchived ...)
├── ui/         # презентационные компоненты сущности (опционально)
├── store.ts    # Redux slice (опционально)
└── index.ts    # Public API
```

**UI в entities — только презентационный.** `LotImagesCarousel` принимает `images` и рисует карусель. Никакой бизнес-логики, никаких модалок действий, никаких импортов из features.

### `shared/` — фундамент

Shared — **универсальный код без знания о домене**. Сюда нельзя положить `LotCard`, потому что Lot — это домен, и место карточке в `entities/lot/ui/`. Сюда можно положить `<ConfirmModal>`, потому что это абстрактная модалка подтверждения.

- **`shared/api`** — axios instance, interceptors (auth, language, rateLimit), типы ApiError. Только транспорт, без знания о ресурсах.
- **`shared/ui`** — UI-кит без домена: `ConfirmModal`, `ErrorStub`, `PhoneInput`, `LanguageSwitcher`, `ThemeSwitcher`.
- **`shared/lib`** — утилиты: `useNavigation` (типизированный wrapper над `react-router`), `notify`, `validators`, `formatters`, `errorHandler`.
- **`shared/constants`** — константы: `ROUTES`, `USER_ROLES`, `USER_LANGUAGES`.

**Жёсткое правило: shared не импортит ни из одного слоя.** Если внутри shared появляется `import { Lot } from '@/entities/lot'` — это сигнал, что компонент должен переехать в entity.

---

## Граф зависимостей в реальном коде

```
                     ┌───────┐
                     │  app  │   ← composition root, store, providers, router
                     └───┬───┘
                         │
                     ┌───▼───┐
                     │ pages │   ← thin pages: orchestrate widgets/entities
                     └───┬───┘
                         │
                     ┌───▼─────┐
                     │ widgets │   ← composite UI blocks
                     └───┬─────┘
                         │
                     ┌───▼──────┐
                     │ features │   ← user actions + business logic
                     └───┬──────┘
                         │
                     ┌───▼──────┐
                     │ entities │   ← domain models, queries, slice stores
                     └───┬──────┘
                         │
                     ┌───▼─────┐
                     │ shared  │   ← primitives, no domain knowledge
                     └─────────┘
```

Стрелка **вниз** = «может импортить». Стрелок наверх по слоям не существует.

---

## Куда положить новый код

Памятка — задайте по порядку 4 вопроса:

1. **Это что-то про конкретный домен?** Если да — продолжаем; если нет (универсальный примитив) → `shared/`.
2. **Это просто отображение свойств доменной сущности или базовая операция над ней (запрос, доменный helper)?** → `entities/<domain>/`.
3. **Это конкретное действие пользователя (login, edit, submit, deactivate)?** → `features/<action>/`.
4. **Это композитный блок UI, собранный из нескольких features/entities, который встраивается в страницу?** → `widgets/<block>/`.

Если ничего не подходит и это новая страница — `pages/<page>/`. Если это инициализация всего приложения — `app/`.

### Шаблон импортов для новых файлов

```ts
// 1) Внешние пакеты
import { useState } from 'react';
import { Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// 2) Слои сверху вниз через @/...
import { useLot } from '@/entities/lot';
import { useNavigation } from '@/shared/lib/navigation';
import { ConfirmModal } from '@/shared/ui';

// 3) Локальные импорты текущего slice
import { useLotFormData } from './useLotFormData';
import type { LotFormValues } from './model';
```

---

## Запуск

```bash
cd client
npm install
npm run dev
```

Стек:

| Что              | Чем                                |
| ---------------- | ---------------------------------- |
| Сервер запросы   | `@tanstack/react-query`            |
| Клиентский стейт | `@reduxjs/toolkit` (минимум)       |
| Формы            | `@mantine/form`                    |
| Валидация        | `zod`                              |
| Роутинг          | `react-router-dom` v6              |
| UI               | `@mantine/core` + `@mantine/hooks` |
| Локализация      | `i18next` + `react-i18next`        |
| HTTP             | `axios`                            |
| Иконки           | `lucide-react`                     |
| Сборка           | `vite`                             |

---
