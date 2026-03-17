# Issues FE (Frontend) — library3

Celem dokumentu jest przygotowanie kompletnego backlogu FE dla MVP aplikacji biblioteki (Next.js + TS),
z zachowaniem zasady:
`mały diff → compose-test → compose-run → commit → push → PR`.

FE jest konsumentem kontraktu API z BE (`/api/*`), ale FE ma własny routing i guardy RBAC.

---

## Źródła prawdy (priorytet)
1. LibraryP.docx — ekrany MVP, flow użytkownika, RBAC, walidacja, paginacja/szukaj/sort.
2. Repo `library3` — stan bieżący (Next.js skeleton, proxy, Compose).
3. Repo `Library-tr` + LibraryR.docx — inspiracja.

---

## MVP — routing (FE)

### Public
- `/` — katalog książek (tabela + search + paginacja + status dostępności)
- `/login` — logowanie
- `/register` — rejestracja

### USER (zalogowany)
- `/loans` — „Moje wypożyczenia” (aktywne + historia) + zwrot

### ADMIN
- `/admin/books` — CRUD książek
- `/admin/loans` — aktywne wypożyczenia + oznacz zwrot
- `/admin/users` — lista użytkowników + usuń (z ograniczeniami)

---

## Krytyczne ryzyko integracyjne: NextAuth vs proxy `/api/*`
Jeżeli używamy NextAuth, domyślny handler działa po stronie FE pod `/api/auth/*`.
Jeżeli jednocześnie proxy’ujemy `/api/*` do backendu, to `/api/auth/*` zostanie „zjedzone” przez proxy.

Decyzja (do wdrożenia w backlogu):
- Zmieniamy proxy do backendu z `/api/*` na `/_api/*` (lub analogiczne), aby:
  - `/api/auth/*` było dostępne dla NextAuth (FE)
  - `/_api/*` proxy’owało do `backend:/api/*`

W konsekwencji FE zawsze:
- używa `/_api/...` dla requestów do backendu w trybie „same-origin”
- NIE używa `/api/...` (bo to przestrzeń FE API routes)

---

## Konwencje FE (docelowe)
- Brak „gołych requestów” w komponentach UI:
  - requesty idą przez `lib/api/*` (client + services) i hooki.
- Jedno mapowanie błędów:
  - 401 → redirect do `/login?returnUrl=...`
  - 403 → komunikat „Brak uprawnień”
  - 409 → komunikat konfliktu + UX (np. disabled, toast)
- RBAC: UI guard + backend guard (defense-in-depth).
- Spójne stany: loading/empty/error, blokady przycisków.

---

## Definition of Done (DoD) — każde issue
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` przechodzą.
- Ręczny test w compose (min. „happy path” dla funkcji).
- Brak sekretów w repo.
- Jeżeli issue dotyczy kontraktu — opis zmian w `ISSUES_BE_library3_MVP.md` / OpenAPI.

---

## Proponowane labelki GitHub
- `area/fe`, `area/auth`, `area/api`, `area/admin`, `area/ux`, `area/tests`, `area/docs`
- `type/feat`, `type/fix`, `type/chore`, `type/refactor`
- `prio/p0`, `prio/p1`, `prio/p2`
- `blocked`

---

## Kolejność realizacji (minimalizacja ryzyka integracyjnego)
1. Stabilizacja sposobu komunikacji z BE (proxy path) + typy (`FE-01..FE-03`)
2. Auth (NextAuth) + guardy (`FE-04..FE-07`)
3. Katalog (`FE-08..FE-12`)
4. Loans USER (`FE-13..FE-16`)
5. Admin (`FE-17..FE-21`)
6. Stabilizacja UX/testy (`FE-24..FE-26`)

---

# Backlog Issues (FE)

## EPIC FE-00 — Fundamenty i spójność integracyjna (P0)

### FE-01 (P0) — Zmiana proxy backendu: `/api/*` -> `/_api/*`
Opis:
- Zmień `next.config.*` rewrites tak, aby proxy do backendu nie zajmowało `/api/*`.
- Zmień FE requesty: `/api/...` → `/_api/...`.

AC:
- FE działa w compose (dev) i widzi backend przez `/_api/health`
- `/api/auth/*` pozostaje wolne dla NextAuth

### FE-02 (P0) — Dodanie zależności MVP: NextAuth + Axios + Tailwind
AC:
- `npm install next-auth axios tailwindcss postcss autoprefixer`
- Tailwind działa globalnie
- build działa w compose

### FE-03 (P0) — API client + typy kontraktu (User/Book/Loan + Pagination + Error)
AC:
- istnieje `src/lib/api/client.ts` + `src/lib/api/services/*`
- typy w `src/types/*`
- jedna obsługa błędów 401/403/409

---

## EPIC FE-01 — Auth i RBAC (P0)

### FE-04 (P0) — NextAuth Credentials: integracja z BE `/api/auth/login`
AC:
- login działa end-to-end
- session zawiera `user.id`, `user.role`, `user.token` (token z BE)
- logout działa

### FE-05 (P0) — Strony `/login` i `/register`
AC:
- walidacja klienta (email, hasło min. 6, confirm password)
- 409 i 401 mapowane na czytelne komunikaty

### FE-06 (P0) — Guard tras: public/USER/ADMIN + returnUrl
AC:
- niezalogowany nie wejdzie na `/loans`
- USER nie wejdzie na `/admin/*`
- po zalogowaniu wraca na `returnUrl`

### FE-07 (P0) — Navbar + widoczność akcji zależnie od roli
AC:
- linki admina widoczne tylko dla ADMIN
- CTA w katalogu zależne od sesji

---

## EPIC FE-02 — Katalog książek (P0)

### FE-08 (P0) — Widok `/`: tabela katalogu z API
AC:
- tabela: tytuł/autor/ISBN/status
- dane z `GET /api/books`

### FE-09 (P0) — Search + debounce + synchronizacja z URL
AC:
- debounce 300–500ms
- `search` w query param

### FE-10 (P0) — Paginacja + limit 10/20/50/100
AC:
- limit wybieralny
- zmiana limitu resetuje stronę do 1

### FE-11 (P1) — Sortowanie (SHOULD)
AC:
- sortBy/order w URL i w requestach
- UI pokazuje aktywny sort

### FE-12 (P0) — Stany loading/empty/error + retry
AC:
- brak „białych stron”
- spójne komunikaty

---

## EPIC FE-03 — USER: wypożyczenia (P0)

### FE-13 (P0) — LoanModal: potwierdzenie wypożyczenia/zwrotu
AC:
- modal ma focus trap, ESC, loading state
- pokazuje dane książki

### FE-14 (P0) — Akcja „Wypożycz” z katalogu
AC:
- 409 -> komunikat „książka już wypożyczona”
- po sukcesie refresh katalogu

### FE-15 (P0) — Widok `/loans`: aktywne + historia
AC:
- sekcja aktywne + historia (tabs lub sekcje)
- zwrot z potwierdzeniem

### FE-16 (P0) — Obsługa błędów 401/403 w widokach chronionych
AC:
- 401 -> redirect do login
- 403 -> komunikat + redirect

---

## EPIC FE-04 — ADMIN (P1)

### FE-17 (P1) — Layout admina + routing
AC:
- wspólny layout `/admin/*`
- spójne tabs

### FE-18 (P1) — `/admin/books`: CRUD książek (BookModal)
AC:
- dodaj/edytuj/usuń z potwierdzeniami
- 409 ISBN -> komunikat

### FE-19 (P1) — `/admin/loans`: aktywne wypożyczenia + oznacz zwrot
AC:
- admin zamyka wypożyczenie
- lista odświeżona

### FE-20 (P1) — `/admin/users`: lista userów + activeLoansCount
AC:
- tabela userów: email/role/activeLoansCount

### FE-21 (P1) — Usuwanie usera z ograniczeniami
AC:
- self-delete zablokowany w UI
- 409 active loans -> komunikat

---

## EPIC FE-05 — UX i testy (P1)

### FE-24 (P1) — Toast/Banner (globalny system komunikatów)
### FE-25 (P1) — Testy krytycznych ścieżek (auth + books)
### FE-26 (P2) — Testy krytycznych ścieżek (loans/admin)

AC:
- `npm test` przechodzi, testy stabilne
