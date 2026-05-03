## FSD

#### Feature-Sliced Design

> Новая предполагаемая структура

```
src/
├── app/                          # Инициализация приложения
│   ├── providers/                # MantineProvider, QueryProvider, RouterProvider
│   ├── router/                   # routes.tsx, guards
│   └── store/                    # Redux store (только то что действительно global)
│
├── pages/                        # Страницы = точки входа маршрутов
│   ├── auth/
│   ├── feed/
│   ├── lot/
│   ├── lot-form/
│   ├── profile/
│   └── admin/
│
├── widgets/                      # Самодостаточные блоки UI
│   ├── AppHeader/
│   ├── AppNavbar/
│   ├── LotCard/
│   ├── LotsFeed/
│   └── TaxonomyTree/
│
├── features/                     # Конкретные юзер-флоу
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── lot/
│   │   ├── create/
│   │   ├── edit/
│   │   └── status-change/
│   ├── profile/
│   │   ├── edit/
│   │   └── avatar/
│   └── geo-filter/
│
├── entities/                     # Доменные сущности
│   ├── user/
│   │   ├── api.ts                # useUserQuery, useSelfUserQuery
│   │   ├── model.ts              # Zod схемы, типы
│   │   ├── store.ts              # userSlice (только auth state)
│   │   └── index.ts
│   ├── lot/
│   │   ├── api.ts
│   │   ├── model.ts
│   │   └── index.ts
│   ├── taxonomy/
│   │   ├── api.ts
│   │   ├── store.ts
│   │   └── index.ts
│   └── geography/
│       ├── api.ts                # useRegions, useCities, useDistricts
│       ├── model.ts
│       └── index.ts
│
└── shared/                       # Переиспользуемые примитивы
    ├── api/                      # axios instances, interceptors
    ├── ui/                       # Button, Modal, ConfirmModal — только dumb компоненты
    ├── lib/                      # validators (zod), formatters, cn()
    ├── hooks/                    # useDisclosure, useTheme — только generic
    ├── constants/                # routes, roles, themes
    └── i18n/                     # ресурсы переводов

```
