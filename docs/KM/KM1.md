# KM1

## 1. Zadania wspólne na start — zadanie organizacyjno-architektoniczne

Zakres MVP w modelu MoSCoW, User Stories, Definition of Done, standard odpowiedzi API `{success,data}` / `{success,error}`, wersja Node, jeden menedżer pakietów — npm, format `.env`, CORS, porty i sieć dockerowa oraz proces pracy: Kanban — GitHub Project.

## 2. DevOps

- utworzenie i uporządkowanie monorepo z katalogami `frontend/`, `backend/`, podstawowym `README` i zasadami branchowania,
- dodanie PR template, issue templates i konwencji Conventional Commits,
- uruchomienie Quality Gate w CI dla FE + BE: `lint`, `typecheck`, `test`, `build`, plus `docker compose build`,
- przygotowanie bazowego `docker compose` dla `frontend`, `backend`, `db`,
- przygotowanie Dockerfile dla FE i BE,
- dodanie root scriptów typu `dev:up`, `dev:down`, `dev:logs`, `lint`, `typecheck`, `test`, `build`,
- przygotowanie szkieletu Swagger/OpenAPI jako wspólnego kontraktu.

### Minimalny zakres Swagger/OpenAPI

- `auth`
- `books`
- `loans`
- `users`
- DTO
- przykłady odpowiedzi
- dokumentacja

**Cel końcowy etapu:** stan, w którym `docker compose up` stawia 3 serwisy bez crashy.

## 3. Backend

- bootstrap Express + TypeScript + ESM,
- przewidywalne komendy `dev`, `build`, `start`, `typecheck`,
- endpoint `GET /api/health`,
- konfiguracja jakości: ESLint, Prettier, test runner, `TS strict`,
- moduł config z walidacją env (`DATABASE_URL`, `JWT_SECRET`, `PORT`),
- globalny error handler i standard odpowiedzi API,
- inicjalizacja Prisma,
- połączenie do PostgreSQL,
- model `User` / `Book` / `Loan`,
- migracje, indeksy i seed.

**Cel końcowy etapu:** szkielet BE.

## 4. Frontend

- uporządkowanie komunikacji FE ↔ BE tak, aby wszędzie był prefix `/api/`,
- jednoznaczne env `NEXT_PUBLIC_API_BASE_URL` / `NEXTAUTH_`,
- inicjalizacja projektu Next.js + TypeScript + Tailwind,
- placeholdery tras `/`, `/login`, `/register`,
- konfiguracja jakości: `lint`, `format`, `typecheck`,
- docelowa struktura katalogów: `app`, `components`, `features`, `lib`, `types`,
- podstawowy layout (Figma — makiety i flow),
- obsługa `error.tsx` i `not-found.tsx`.

## 5. Strumienie równoległe

Równolegle mogą ruszyć trzy strumienie:

- **DevOps:** repo + CI + compose + env examples,
- **Backend:** bootstrap + health + config + Prisma + seed,
- **Frontend:** Next.js foundation + env + layout + integracja `/api/`.

## 6. Issue do założenia

### M1

- **M1:** ustalenia wspólne (Definition of Done: spisana i zatwierdzona decyzja)

### DevOps

- **DO-A1:** PR template (szablon) + workflow GitHub (issue ma wymusić, żeby każdy merge miał minimalny opis: co zmieniono, jak przetestowano)
- **DO-A2:** root scripts monorepo (z roota mają działać spójne komendy: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, a FE i BE mają być odpalane jednolicie przez `docker compose run`)
- **DO-A3:** CI quality gate (zakres: `lint` + `typecheck` + `test` + `build` + `docker compose build`)
- **DO-B1:** docker compose dla FE / BE / DB (jedno wspólne środowisko dla wszystkich)
- **DO-A4:** README + dokumentacja

### Backend

- **BE-A1:** bootstrap backend + `/api/health`
- **BE-A3:** env / konfiguracja (`dotenv` + walidacja)
- **BE-A4:** standard odpowiedzi + error handler
- **BE-B2:** workflow Prisma: `generate`, `migrate`, readiness DB
- **BE-B3:** model danych `User`, `Book`, `Loan` z relacjami
- **BE-I1:** Swagger UI pod `/api/docs` + skeleton OpenAPI
- **BE-K1:** README + dokumentacja

### Frontend

- **FE-A0:** spójność `/api/` i base URL
- **FE-A1:** inicjalizacja projektu Next.js + TypeScript + Tailwind
- **FE-A2:** konfiguracja jakości: ESLint, Prettier, `format:check`, `typecheck`
- **FE-A4:** konfiguracja `.env` i walidacja runtime
- **FE-H2:** dokumentacja uruchomienia FE
