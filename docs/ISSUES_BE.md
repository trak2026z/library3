# ISSUES_BE.md
# Issues BE (Backend) — library3

Cel: backlog dla backendu (Node.js/Express/TS ESM/Prisma/Postgres) zgodny z kontraktem MVP oraz kompatybilny z FE.

## Konwencje i definicje
- API prefix: `/api/*`
- Swagger/OpenAPI: `/api/docs`
- Health (do wdrozen): `/api/health` (liveness) + opcjonalnie `/api/ready` (readiness, z DB)
- Standard odpowiedzi (docelowo):
  - sukces: `{ success: true, data: ... }`
  - blad: `{ success: false, error: { code, message, details? } }`
- Kody HTTP: 200/201/204, 400/401/403/404/409/500
- DoD (Definition of Done) dla kazdego issue:
  - testy (jesli dotyczy) + aktualizacja Swagger
  - brak `any` w nowym kodzie (poza uzasadnionymi generykami)
  - komendy przechodza: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`

## Proponowane etykiety (GitHub labels)
- area/be, area/db, area/devops, area/security, area/tests, area/docs
- type/feat, type/fix, type/chore, type/refactor
- prio/p0, prio/p1, prio/p2
- status/blocked (jesli zalezne)

---

# EPIC A — Fundamenty BE i konfiguracja projektu

## A1. Uporzadkowanie uruchomienia BE (dev/build/prod) + bootstrap
Opis: doprowadzic backend do przewidywalnych komend i stabilnego startu w dev/prod.
AC:
- `npm run dev` startuje serwer w trybie dev (hot reload)
- `npm run build` przechodzi (TS compile do `dist/`)
- `npm start` uruchamia build (prod mode)
- `GET /api/health` -> 200 (minimum: liveness bez DB)

Zadania:
- dodac `build`, `start`, `typecheck` do `backend/package.json`
- ustawic output TS (np. `dist/`) i wskazac entry w `start`
- dodac endpoint `/api/health` (liveness)

## A2. Konfiguracja narzedzi jakosci (lint/format/test skeleton, tsconfig hardening)
AC:
- dzialaja: `npm run dev`, `npm run build`, `npm run lint`, `npm run format:check`, `npm test`
- TS strict + dodatkowe flagi (rekomendowane): `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- brak `any` w nowym kodzie (wyjatki: generyki/adaptery opisane komentarzem)

Zadania:
- ESLint + Prettier (konfiguracja pod TS ESM)
- skrypty: `lint`, `format`, `format:check`, `test`, `test:ci`
- podstawowy setup runnera testow (np. Vitest/Jest) + supertest

## A3. Env / konfiguracja (dotenv + walidacja)
AC:
- brak `DATABASE_URL`/`JWT_SECRET`/`PORT` -> proces konczy sie czytelnym bledem z lista brakow
- `.env.example` istnieje i jest kompletny (backend/)
- config jest ladowany przed startem app (takze w dockerze)

Zadania:
- dodac ladowanie `.env` w entrypoint
- zrobic modul `config` z walidacja (np. zod/envalid) i eksportem typow

## A4. Globalny handler bledow + standard odpowiedzi API
AC:
- kazdy blad ma format `{success:false,error:{code,message,details?}}`
- kontrolery nie zwracaja stacktrace do klienta
- 400/401/403/404/409/500 sa mapowane spojnymi `error.code` (np. `VALIDATION_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL`)

Zadania:
- middleware error handler na koncu pipeline
- wspolne klasy bledow (ValidationError, AuthError, ForbiddenError, NotFoundError, ConflictError)
- refactor kontrolerow: `try/catch` -> rzucanie bledow domenowych

## A5. Konfiguracja Express (CORS, security headers, request id, limity, graceful shutdown)
AC:
- CORS sterowany przez env (np. `CORS_ORIGIN`) i pozwala FE na requesty
- ustawione limity body (JSON)
- naglowki bezpieczenstwa (helmet) wlaczone
- serwer konczy prace na `SIGTERM` (graceful shutdown)
- requestId (`X-Request-Id` albo generowany) jest logowany i zwracany w response headers

Zadania:
- `helmet`, poprawne `cors` (origin + credentials wg potrzeb)
- middleware requestId + logger (np. pino)
- obsluga `SIGTERM` + zamkniecie serwera i Prisma

---

# EPIC B — Baza danych (PostgreSQL) i Prisma

## B1. Docker Compose dev dla BE + DB (Postgres) + siec wewnetrzna
AC:
- `docker compose -f docker-compose.dev.yml up --build` uruchamia DB i BE
- BE laczy sie z DB po `db:5432`
- host port DB: `5434->5432` (zgodnie z dokumentacja)
- healthcheck DB i BE skonfigurowany w compose

Zadania:
- poprawic mapowanie portow i `DATABASE_URL`
- dodac healthchecki (db + backend)

## B2. Prisma workflow (generate/migrate) + readiness ping DB
AC:
- `npx prisma generate` dziala
- `npx prisma migrate dev` tworzy schemat
- `/api/ready` (lub rozszerzony `/api/health`) sprawdza polaczenie z DB w dev

Zadania:
- skrypty `prisma:generate`, `prisma:migrate:dev`, `prisma:migrate:deploy`
- readiness query (np. `SELECT 1` przez Prisma)

## B3. Model danych: User, Book, Loan (relacje) + zgodnosc z kontraktem
AC:
- migracja tworzy tabele i relacje zgodnie z modelem MVP
- `Loan.returnDate = null` oznacza aktywne wypozyczenie
- rola `User.role` ma enum USER/ADMIN
- pole hasla w DB to `passwordHash` (nie "password") i nie wyplywa do API

Zadania:
- ewentualna migracja: `User.password` -> `passwordHash`
- uzgodnic nazewnictwo: `borrowedAt` vs `loanDate` (i zaktualizowac OpenAPI)

## B4. Ograniczenia i indeksy w DB
AC:
- unique: `User.email`, `Book.isbn`
- indeksy pod search/sort: `Book.title`, `Book.author`, `Book.isbn`
- duplikat na API mapuje sie na 409 z konkretnym `error.code`

Zadania:
- dodac indeksy w Prisma schema
- centralne mapowanie Prisma error codes (P2002 -> CONFLICT)

## B5. Migracje: workflow (dev/prod)
AC:
- opisane komendy: `migrate dev` (lokalnie) i `migrate deploy` (prod)
- w dockerze: migracje da sie uruchomic jako osobny krok

Zadania:
- sekcja w README backendu + komendy w package.json

## B6. Seeder danych testowych
AC:
- `npm run seed` dziala lokalnie
- `docker compose exec backend npm run seed` dziala
- seed tworzy: admin, userow, ksiazki (20-50), przykladowe wypozyczenia

Zadania:
- rozbudowac seed do docelowego wolumenu MVP
- upewnic sie, ze seed nie ujawnia hasel w logach prod

---

# EPIC C — DTO + walidacja + middleware

## C1. Middleware walidacji DTO (body/query/params)
AC:
- niepoprawne body/query/params -> 400 z lista bledow (pole + komunikat)
- query: `page/limit` transformowane do number i walidowane

Zadania:
- rozszerzyc walidacje o `req.query` i `req.params`
- unikac `any` w `validateDto` (generyk + typy)

## C2. DTO: Auth (RegisterDto, LoginDto)
AC:
- email walidowany
- haslo min 6
- komunikaty bledow sa "uzywalne" (bez ogolnikow)

## C3. DTO: Book (Create/Update/Response)
AC:
- ISBN walidowany (ISBN10/ISBN13)
- duplikat ISBN -> 409
- update: jasno opisane PATCH-like (partial) albo PUT (full) i spojnosc w kontrolerach + OpenAPI

## C4. DTO: Loans (CreateLoanDto + param validation)
AC:
- walidacja `bookId` w body
- walidacja `:id` w paramach (zgodna z Prisma: Int)

## C5. DTO: Query dla listy ksiazek (GetBooksQueryDto)
AC:
- `page >= 1`, `limit` w zakresie (1-100)
- `sortBy` whitelist (title/author/isbn/createdAt), `order` asc/desc

---

# EPIC D — Bezpieczenstwo: JWT + RBAC

## D1. JWT tools (sign/verify, TTL z env)
AC:
- TTL konfigurowalne przez env (np. `JWT_EXPIRES_IN=24h`)
- token zawiera `sub` (userId) + `role`
- uzycie wspolnego utila w auth middleware

## D2. AuthMiddleware: Bearer + req.user (typed)
AC:
- brak/niepoprawny token -> 401
- poprawny -> `req.user = { id, role }` (bez `any`)

## D3. RoleMiddleware (wielokrotnego uzycia)
AC:
- `requireAdmin` blokuje USER -> 403
- dostepna funkcja `requireRole(...roles)`

## D4. Hashowanie hasel (bcrypt) + brak wycieku
AC:
- w DB tylko hash
- porownanie w login dziala
- haslo nigdy nie wraca w response/logach

---

# EPIC E — Modul Auth (endpointy)

## E1. POST /api/auth/register
AC:
- tworzy USER
- konflikt email -> 409
- 201 zwraca user bez wrazliwych pol
- decyzja: (A) bez tokena, (B) auto-login i zwrot tokena + opis w OpenAPI

## E2. POST /api/auth/login
AC:
- zle dane -> 401
- poprawne -> `{ token, user:{id,email,role}, expiresIn }` (albo inny opisany format)
- token TTL zgodny z `JWT_EXPIRES_IN`

---

# EPIC F — Modul Books

## F1. GET /api/books (paginacja/search/sort)
AC:
- `search` dziala na title/author/isbn (OR)
- response ma meta paginacji (`items/page/limit/total/totalPages` lub uzgodniony kontrakt)
- `isAvailable` zawsze obecne w DTO

## F2. Wyliczanie `isAvailable` (bez N+1)
AC:
- brak "N zapytan na N ksiazek" dla listy
- aktywny Loan (`returnDate=null`) -> `isAvailable=false`

## F3. GET /api/books/:id
AC:
- brak -> 404
- zwraca BookResponseDto (+ `isAvailable`)

## F4. POST /api/books (ADMIN)
AC:
- wymaga JWT + ADMIN
- duplikat ISBN -> 409
- 201

## F5. PUT/PATCH /api/books/:id (ADMIN)
AC:
- 404 gdy brak
- 409 przy konflikcie ISBN
- 200 zwraca zaktualizowany obiekt

## F6. DELETE /api/books/:id (ADMIN)
AC:
- 204 gdy usunieto
- aktywne wypozyczenie -> 409 (spojnie)
- polityka opisana w OpenAPI/README

---

# EPIC G — Modul Loans

## G1. POST /api/loans (zalogowany)
AC:
- sprawdza dostepnosc
- 409 gdy zajeta
- 201, loan przypisany do `req.user.id`
- zabezpieczenie na race condition:
  - transakcja + blokada/unikalnosc aktywnego wypozyczenia ksiazki
  - rekomendacja: constraint (partial unique) + obsluga 409

## G2. PUT /api/loans/:id/return (zalogowany lub ADMIN)
AC:
- owner lub ADMIN
- 403 dla obcego USER
- 404 gdy brak
- decyzja: idempotencja:
  - (A) 200 idempotentnie gdy juz zwrocone, albo
  - (B) 409 gdy juz zwrocone
- 200 ustawia `returnDate`

## G3. GET /api/loans/me
AC:
- zwraca aktywne + historia (dwa pola albo jedna lista + filtr)

## G4. GET /api/loans (ADMIN)
AC:
- USER -> 403
- zwraca wypozyczenia + info o userze i ksiazce (min. id/email + book title/isbn)

## G5. Admin "oznacz jako zwrocone"
AC:
- preferowane: uzycie `PUT /api/loans/:id/return` z uprawnieniem ADMIN
- admin moze zamknac dowolne wypozyczenie

---

# EPIC H — Modul Users (ADMIN)

## H1. GET /api/users (ADMIN)
AC:
- lista userow z rola i liczba aktywnych wypozyczen (agregacja, nie lista loanow)
- USER -> 403

## H2. GET /api/users/:id (ADMIN)
AC:
- 200/404
- brak danych wrazliwych (passwordHash)

## H3. DELETE /api/users/:id (ADMIN) + ograniczenia
AC:
- aktywne wypozyczenia -> 409
- self-delete -> 403 (polityka) i opis w OpenAPI/README
- 204 w poprawnym przypadku

---

# EPIC I — Swagger/OpenAPI

## I1. Swagger UI pod /api/docs
AC:
- endpoint dziala
- auth bearer opisany (security scheme)
- modele/DTO opisane i zgodne z rzeczywistymi response

## I2. Przyklady request/response + kody bledow
AC:
- przyklady dla auth/books/loans/users
- pokazane 409 (email/ISBN/loan conflict), 403 RBAC, 401 auth
- spojnosc z formatem `{success,...}`

---

# EPIC J — Konteneryzacja produkcyjna + CI/CD (BE ownership / DevOps)

## J1. Dockerfile BE (multi-stage) + healthcheck
AC:
- obraz prod minimalny (multi-stage, bez dev deps)
- `/api/health` uzyte jako healthcheck
- dziala lokalnie: `docker build` + `docker run`

## J2. docker-compose.dev.yml (dev) dla backendu z hot-reload
AC:
- mount kodu dziala
- `npm run dev` w kontenerze dziala stabilnie

## J3. docker-stack.yml (swarm) — backend service (prod)
AC:
- `docker stack deploy` dziala
- service ma `replicas`, `update_config`, `restart_policy`
- sekrety/env rozwiazane (bez plaintext w repo)

## J4. CI: build/test/lint + build image (BE)
AC:
- workflow na PR: lint + typecheck + test + build
- workflow na main/tag: build image

## J5. CI: push do registry (GHCR/ACR)
AC:
- obraz trafia do registry z tagiem SHA (opcjonalnie semver)
- logowanie przez OIDC lub bezpieczne sekrety (do ustalenia)

## J6. CD: deploy na Swarm (SSH/self-hosted runner)
AC:
- pipeline wykonuje `docker stack deploy` na swarm managerze
- rollback opisany i przetestowany (redeploy poprzedniego tagu)

---

# EPIC K — Testy (minimum krytycznych sciezek) + stabilizacja kontraktu

## K0. Harness testowy (test DB)
AC:
- testy uruchamiaja sie na izolowanej bazie (np. Testcontainers albo docker-compose test)
- migracje/seed na start testow

## K1. Testy integracyjne: Auth
AC:
- register/login + bledne dane + konflikt email

## K2. Testy integracyjne: Books
AC:
- list (paginacja/search) + CRUD admin + 409 ISBN + `isAvailable`

## K3. Testy integracyjne: Loans
AC:
- borrow/return + 409 gdy zajeta + 403 nie-wlasciciel + scenariusz race condition (symulacja)

## K4. Testy integracyjne: Users (ADMIN)
AC:
- lista + delete constraints (active loans, self-delete)

---