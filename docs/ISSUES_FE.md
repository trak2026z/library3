# ISSUES_FE.md
# Issues FE (Frontend) — Library-tr

> Uwaga: plik nazwany zgodnie z prośbą (`ISSUES_BE.md`), ale zawartość dotyczy Frontendu (FE).

Cel: backlog FE (Next.js App Router + TypeScript) pod aplikację biblioteki, kompatybilny z kontraktem BE `/api/*`.

## Stan repo (snapshot)
- FE: `frontend/` (Next.js), kod w `frontend/src/*`
- App Router: `frontend/src/app/*` (jest już `/books`, `/books/new`, `/books/[id]/edit`)
- NextAuth: `frontend/src/app/api/auth/[...nextauth]/route.ts` (Credentials → call do backendu)
- API client: `frontend/src/lib/axios.ts` (env: `NEXT_PUBLIC_API_URL`, domyślnie `http://localhost:4000`)
- Styling: aktualnie “bootstrap-like” klasy + własny CSS (`globals.css`), brak Tailwind

## Konwencje FE (docelowe)
- Brak “gołych requestów” w `app/*` (tylko feature/hook/service)
- Jeden klient API (axios/fetch) + 1 standard obsługi błędów
- RBAC: UI “defense-in-depth” (ukrywanie akcji + guard tras)
- DoD (Definition of Done) dla issue:
  - `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` przechodzą
  - aktualizacja README i (jeśli dotyczy) kontraktów DTO
  - a11y dla kluczowych UI (modal, formularze)

## Proponowane etykiety (GitHub labels)
- area/fe, area/auth, area/api, area/admin, area/ux, area/devops, area/tests, area/docs
- type/feat, type/fix, type/chore, type/refactor
- prio/p0, prio/p1, prio/p2
- status/blocked

---

# EPIC FE-A — Fundamenty projektu i konfiguracja

## FE-A0 (P0). Naprawa spójności FE ↔ BE (prefix `/api`, baseURL, auth/login)
Opis: FE musi mówić do BE po `/api/*` (np. `/api/auth/login`), a nie po gołych `/auth/login`.
AC:
- NextAuth (Credentials) loguje się przez `/api/auth/login`
- Jednoznaczny `API_BASE_URL` i/lub `NEXT_PUBLIC_API_BASE_URL` (z opisem w README)
- Lokalne uruchomienie w `docker compose` działa end-to-end (FE → BE)

Zadania:
- ujednolicić endpointy w `src/app/api/auth/[...nextauth]/route.ts`
- doprecyzować nazwę env: preferowane `NEXT_PUBLIC_API_BASE_URL` (z fallback na istniejące `NEXT_PUBLIC_API_URL`)
- dodać krótki “contract note” w README (prefix `/api`)

## FE-A1. Inicjalizacja projektu (Next.js + TypeScript + Tailwind)
AC:
- `npm run dev` uruchamia FE bez błędów
- Tailwind działa (widoczny styl globalny + utilities)
- routing działa: min. `/`, `/login`, `/register` jako placeholdery + istniejące `/books`

Zadania:
- dodać Tailwind (tailwindcss + postcss + autoprefixer) i skonfigurować `globals.css`
- stworzyć placeholdery `app/login/page.tsx`, `app/register/page.tsx`

## FE-A2. Konfiguracja jakości (ESLint/Prettier, import order, scripts)
Doprecyzowanie: dodaj `format:check` i `typecheck`.
AC:
- `npm run lint`, `npm run format:check`, `npm run typecheck` przechodzą
- spójne reguły importów (sort + aliasy)
- (opcjonalnie) pre-commit hook blokuje złe formatowanie/lint

Zadania:
- dodać Prettier + config + skrypty `format`, `format:check`
- dodać `typecheck` (`tsc --noEmit`)
- dodać reguły import order (np. eslint plugin) + alias `@/*` (już istnieje w tsconfig)

## FE-A3. Struktura katalogów i konwencje
Zakres (App Router, rekomendacja):
- `src/app/` (routes + layouty)
- `src/components/` (shared UI)
- `src/features/` (books/loans/admin/auth)
- `src/lib/api/`, `src/lib/auth/`
- `src/types/` (DTO/kontrakty), `src/hooks/`, `src/utils/`
AC:
- opis konwencji w README
- brak “gołych requestów” w `app/*`

Zadania:
- utworzyć foldery + przenieść logikę z `app/books/*` do `features/books/*` (app = tylko “composition”)

## FE-A4. Konfiguracja `.env` i walidacja runtime
AC:
- brak wymaganych env → czytelny błąd na starcie (`next dev` / `next start`)
- działa lokalnie i w Dockerze (dev)
- `.env.example` kompletny

Zadania:
- dodać `src/lib/env.ts` z walidacją (zod/envalid)
- `.env.example` (min.: `NEXT_PUBLIC_API_BASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`)

## FE-A5. Layout bazowy i styl aplikacji
AC:
- globalny `RootLayout` używany przez wszystkie strony
- wspólne komponenty: `Container`, `Navbar`, podstawowa typografia
- brak duplikacji klas w wielu miejscach (wydzielone komponenty)

Zadania:
- dodać `Navbar` (linki zależne od roli/sesji)
- `Container` + style bazowe w Tailwind

## FE-A6. Strona błędu i boundary + not-found
AC:
- `app/error.tsx` i `app/not-found.tsx` istnieją i mają czytelny UX
- aplikacja nie daje “białej strony” przy błędzie w fetch/render

---

# EPIC FE-B — Warstwa komunikacji z API i typy

## FE-B1. Klient API (Axios instance: baseURL + timeout + headers)
AC:
- jedno miejsce konfiguracji (`src/lib/api/client.ts`)
- timeout ustawiony sensownie
- brak duplikacji konfiguracji w serwisach

Zadania:
- przenieść/rozszerzyć obecny `src/lib/axios.ts` do `src/lib/api/client.ts`
- ustawić `Content-Type`, `Accept`, timeout, obsługę prefix `/api`

## FE-B2. Interceptory: token/session + mapowanie błędów
Zakres:
- 401: `signOut()` lub redirect do `/login` + `returnUrl`
- 403: komunikat “Brak uprawnień”
- 409: komunikat konfliktu (ISBN, aktywne wypożyczenie)
- 400/422: mapowanie błędów walidacji do formularza
AC:
- powtarzalne zachowanie w całej aplikacji (toasty + inline errors)
- brak rozjechanych komunikatów dla tego samego kodu

Zadania:
- centralny `ApiError` + mapper `{ success:false, error:{code,message,details?} }`
- interceptory axios + integracja z toast systemem

## FE-B3. Typy/kontrakty danych (User, Book, Loan, paginacja)
AC:
- typy używane w hookach/serwisach/komponentach
- brak `any` w krytycznych miejscach
- wspólny typ paginacji

Zadania:
- `src/types/api.ts` (User/Book/Loan/Pagination + ErrorResponse)
- spiąć typy z serwisami

## FE-B4. Warstwa serwisów API (auth/books/loans/admin/users)
AC:
- komponenty nie robią “gołych requestów”
- serwisy zwracają dane w 1 standardzie (unwrap `{success,data}` albo typed result)

Zadania:
- `src/lib/api/services/*` (auth/books/loans/users)

## FE-B5. Warstwa data-fetching (cache/dedup/retry)
Propozycja: TanStack Query.
AC:
- listy mają cache + dedup
- retry/backoff sensownie ustawione
- invalidacja po mutacjach odświeża właściwe query
- brak spamowania API przy szybkim szukaniu

Zadania:
- dodać TanStack Query provider w layout
- query keys + invalidacje (books, loans, users)

---

# EPIC FE-C — Autentykacja i autoryzacja (NextAuth + RBAC)

## FE-C1. Integracja NextAuth (Credentials, callbacks, session shape)
AC:
- logowanie działa, sesja utrzymana po refresh
- wylogowanie działa
- w sesji: min. `user.id`, `user.role`, oraz token BE (jeśli potrzebny)

Zadania:
- dopisać callbacks (jwt/session) i znormalizować payload z BE
- walidacja env `NEXTAUTH_URL`, `NEXTAUTH_SECRET`

## FE-C2. Strony: Logowanie i Rejestracja
AC:
- walidacja klienta + błędy z API do pól/toastów
- flow po rejestracji jest jednoznaczne (auto-login lub redirect do login) i spójne z BE

Zadania:
- `/login`, `/register` (form + error mapping)
- decyzja: auto-login po register vs redirect (spisać w README)

## FE-C3. Ochrona tras (public/protected) + returnUrl
AC:
- niezalogowany nie wejdzie w `/loans`
- USER nie wejdzie w `/admin/*`
- po zalogowaniu wraca na `returnUrl`

Zadania:
- middleware lub guard layoutów (App Router)
- helper do budowania `returnUrl`

## FE-C4. Kontrola roli (RBAC w UI)
AC:
- linki/akcje admina niewidoczne dla USER
- guard blokuje wejście w URL mimo ręcznej nawigacji

---

# EPIC FE-D — Widok publiczny: katalog książek

## FE-D0 (P0). Refactor istniejącego `/books` z mocków na API + spójny UI kit
Opis: w repo jest makieta `/books` i `BookForm`, ale bez API i z “bootstrap-like” klasami.
AC:
- lista książek oparta o API
- UI spójny (Tailwind) + obsługa stanów

Zadania:
- przenieść UI do `features/books`
- zamienić klasy bootstrap na Tailwind (lub shadcn/ui)

## FE-D1. Strona główna: tabela katalogu książek
AC:
- tabela renderuje `title/author/isbn/status`
- działa na danych z API (bez mocków)

## FE-D2. Dostępność + CTA
AC:
- status zgodny z API (`isAvailable`)
- dla wypożyczonych CTA “Wypożycz” disabled
- dla niezalogowanych CTA prowadzi do login (z returnUrl)

## FE-D3. Wyszukiwanie + debounce
AC:
- debounce 300–500ms
- brak spamowania API
- search zsynchronizowany z query param w URL

## FE-D4. Sortowanie + synchronizacja stanu
AC:
- sort wpływa na listę (parametry do API)
- stan sortowania widoczny w UI
- stan w URL

## FE-D5. Paginacja + limit (10/20/50/100)
AC:
- liczenie stron na podstawie metadanych
- zmiana limitu resetuje stronę do 1

## FE-D6. Obsługa stanów: loading/empty/error
AC:
- loading skeleton/spinner
- empty state
- error state + retry

---

# EPIC FE-E — USER: wypożyczenia

## FE-E1. LoanModal (potwierdzenie wypożyczenia/zwrotu)
AC:
- focus trap + ESC
- pokazuje tytuł/autor/isbn
- loading state przy submit

## FE-E2. Akcja “Wypożycz” z katalogu
AC:
- po sukcesie: toast + invalidacja books
- 409: czytelny komunikat
- brak double click (disabled)

## FE-E3. Widok “Moje wypożyczenia”
AC:
- aktywne + historia (sekcje lub tabs)
- loading/empty/error

## FE-E4. Zwrot książki
AC:
- potwierdzenie
- invalidacja “me loans” + ewentualnie books

---

# EPIC FE-F — ADMIN

## FE-F1. Panel admina: routing i layout
AC:
- `/admin` tylko dla ADMIN
- layout admina spójny (tabs/side nav)

## FE-F2. Zarządzanie książkami (BookModal dodaj/edytuj)
AC:
- walidacja pól + obsługa 409 ISBN
- po zapisie: tabela odświeżona
- edycja: prefill wartości

## FE-F3. Usuwanie książki (z potwierdzeniem)
AC:
- potwierdzenie
- 409 (aktywne wypożyczenia) → czytelny komunikat

## FE-F4. “Użytkownicy” (tabela + rola + liczba aktywnych wypożyczeń)
AC:
- dane spójne z API
- loading/empty/error

## FE-F5. Usuwanie użytkownika z ograniczeniami
AC:
- self-delete: UI blokuje + pokazuje powód
- aktywne wypożyczenia: 409 → komunikat
- po sukcesie: tabela odświeżona

## FE-F6. “Wszystkie wypożyczenia” (ADMIN)
AC:
- lista (min. aktywne, opcjonalnie historia)
- filtrowanie po statusie (zalecane)

## FE-F7. Ręczne oznaczenie zwrotu
AC:
- admin może zamknąć dowolne wypożyczenie
- po akcji: lista odświeżona, toast sukcesu/błędu

---

# EPIC FE-G — UX, walidacja i odporność

## FE-G1. System komunikatów (toast/banners)
AC:
- jednolity komponent toast
- globalny handler błędów dla API (FE-B2)

## FE-G2. Walidacja formularzy (client-side)
AC:
- wymagane pola
- hasło min. 6 + confirm password w rejestracji
- blokada submit gdy invalid

## FE-G3. Stany ładowania i blokady
AC:
- brak podwójnych submitów
- przyciski disabled w trakcie requestów
- modale nie znikają bez informacji

## FE-G4. Empty/Error states
AC:
- brak danych = sensowny ekran
- błąd sieci/500 = komunikat + retry

## FE-G5. A11y i ergonomia
AC:
- modal: ESC, focus trap
- aria-label dla ikon
- poprawny focus ring / nawigacja klawiaturą

## FE-G6. i18n / formatowanie dat (opcjonalnie)
AC:
- daty w loans czytelne i spójne (PL)
- brak surowych ISO stringów w UI

---

# EPIC FE-H — Testy, dokumentacja, release

## FE-H1. Testy (minimum krytyczne ścieżki)
Zakres minimalny:
- auth flow (login/register walidacja)
- books list (search/sort/pagination)
- LoanModal (open/confirm/cancel)
AC:
- `npm test` przechodzi lokalnie i w CI
- testy powtarzalne (no flaky)

Zadania:
- wybrać runner (Vitest/Jest) + Testing Library
- dodać testy integracyjne komponentów + mock API

## FE-H2. Dokumentacja uruchomienia FE
AC:
- README: env + start lokalnie + start w Dockerze
- nowa osoba uruchamia FE wg instrukcji

## FE-H3. Produkcyjny build
AC:
- `npm run build` przechodzi
- brak krytycznych błędów runtime po `npm start`
- podstawowy happy path ręcznie sprawdzony

---

# EPIC FE-I — Docker / Dev Compose / Azure / CI/CD (FE + DevOps)

## FE-I0 (P0). Naprawa root docker-compose (E2E dev) pod FE
AC:
- `docker compose up --build` uruchamia FE/BE/DB i FE widzi API
- dokumentacja w README

Zadania:
- poprawić DB port mapping i DATABASE_URL w compose
- dopisać env dla FE (NEXT_PUBLIC_API_BASE_URL, NEXTAUTH_URL/SECRET)

## FE-I1. Dockerfile FE (multi-stage) + tryb produkcyjny Next
AC:
- `docker build` działa
- kontener startuje i serwuje FE
- obraz możliwie mały (standalone output lub podobne)

## FE-I2. docker-compose.dev.yml — FE w dev (hot reload)
AC:
- `docker compose -f docker-compose.dev.yml up` uruchamia FE w dev
- zmiany w kodzie odświeżają się bez rebuild obrazu

## FE-I3. docker-stack.yml (swarm) — serwis FE
AC:
- FE działa w swarm (replicas, update policy)
- env (API url) jednoznaczny i udokumentowany

## FE-I4. CI: quality gate dla FE
AC:
- na PR: lint + typecheck + test + build
- blokuje merge przy porażce

## FE-I5. CI: build & push image do GHCR
AC:
- obraz FE ląduje w GHCR (tag SHA + opcjonalnie semver)

## FE-I6. CD: deploy
AC:
- pipeline aktualizuje stack
- rollback: powrót do poprzedniego taga opisany w runbooku