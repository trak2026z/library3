# Issues BE (Backend) — library3

Celem tego dokumentu jest udostępnienie zespołowi BE kompletnego, weryfikowalnego backlogu MVP zgodnego ze źródłem prawdy (`LibraryP.docx`) i możliwego do realizacji w trybie:

`mały diff → compose-test → compose-run → commit → push → PR`

---

## Źródła prawdy (priorytet)

1. `LibraryP.docx` — wymagania MVP i reguły biznesowe.
2. Repo `library3` — stan istniejący i ograniczenia techniczne (Compose/CI).
3. Repo referencyjne `Library-tr` + `LibraryR.docx` — inspiracja.

Każdy konflikt zapisujemy w `docs/KM.md` (sekcja „Decyzje i rozbieżności”) i oznaczamy `DO POTWIERDZENIA`, jeśli brak rozstrzygnięcia.

---

## Założenia MVP (BE)

### Role i RBAC (MVP)
- Role: `USER | ADMIN`
- Zasada: wszystkie endpointy „admin” wymagają `ADMIN`; endpointy „moje” wymagają zalogowania.
- RBAC obowiązuje na BE niezależnie od FE (defense-in-depth).

### Model domeny (MVP)
- `User`: `id`, `email` (unique), `passwordHash`, `role`, `createdAt`
- `Book`: `id`, `title`, `author`, `isbn` (unique), `createdAt`
- `Loan`: `id`, `userId`, `bookId`, `loanDate`, `returnDate` (null = aktywne)

### Dostępność książki
- `Book.isAvailable = true` jeśli NIE istnieje aktywny `Loan` dla tej książki (tj. `returnDate = null`).

---

## Kontrakt API (MVP)

### Base path
- Prefix API: `/api`
- Swagger UI: `/api/docs`
- Health:
  - `/api/health` — liveness + (w MVP) readiness DB

### Envelope odpowiedzi

#### Sukces
```json
{ "success": true, "data": {} }
```

#### Błąd
```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable",
    "details": {}
  }
}
```

### Kody HTTP
- `200`, `201`, `204`
- `400` — walidacja
- `401` — brak/niepoprawny token
- `403` — brak roli
- `404` — brak zasobu
- `409` — konflikt biznesowy
- `500`

### Konsekwentne kody `409` (MVP)
Zwracamy `409` w co najmniej tych sytuacjach:
- `EMAIL_TAKEN` — rejestracja z istniejącym e-mailem
- `ISBN_TAKEN` — tworzenie/edycja książki z istniejącym ISBN
- `BOOK_NOT_AVAILABLE` — próba wypożyczenia niedostępnej książki
- `BOOK_HAS_ACTIVE_LOAN` — próba usunięcia książki z aktywnym wypożyczeniem
- `USER_HAS_ACTIVE_LOANS` — próba usunięcia użytkownika z aktywnymi wypożyczeniami

---

## Endpointy MVP (BE)

### Auth
- `POST /api/auth/register` — `{email, password}`
- `POST /api/auth/login` — `{email, password}` → JWT
- `(opcjonalnie) GET /api/auth/me` — zwróć `{id,email,role}`

### Books
- `GET /api/books` — paginacja + search (+ sort)
  - query: `page` (>=1), `limit` ∈ `{10,20,50,100}`, `search?`, `sortBy?`, `order?`
- `POST /api/books` — `(ADMIN)` create
- `PUT /api/books/:id` — `(ADMIN)` update
- `DELETE /api/books/:id` — `(ADMIN)` delete (`409` jeśli aktywny loan)

### Loans
- `POST /api/loans` — `(zalogowany)` wypożycz: `{bookId}`
- `PUT /api/loans/:id/return` — `(owner lub ADMIN)` zwrot
- `GET /api/loans/me` — `(zalogowany)` aktywne + historia
- `GET /api/loans` — `(ADMIN)` aktywne (minimum), opcjonalnie historia

### Users (ADMIN)
- `GET /api/users` — `(ADMIN)` lista userów + liczba aktywnych wypożyczeń
- `DELETE /api/users/:id` — `(ADMIN)` tylko jeśli brak aktywnych wypożyczeń; brak self-delete

---

## Definition of Done (DoD) — każde issue
- PR ma link do issue i zawiera test plan (compose).
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` przechodzą (min. w compose, zgodnie z root scripts).
- Swagger `/api/docs` zaktualizowany dla zmian kontraktu.
- Brak sekretów w repo; `.env` nie commitowany.
- Błędy i `409` są udokumentowane w OpenAPI.

---

## Proponowane labelki GitHub
- `area/be`, `area/db`, `area/security`, `area/tests`, `area/docs`
- `type/feat`, `type/fix`, `type/chore`, `type/refactor`
- `prio/p0`, `prio/p1`, `prio/p2`
- `blocked`

---

## Kolejność realizacji (minimalizacja ryzyka integracyjnego)
1. Kontrakt API + error envelope (`BE-02/BE-03`) — BE jako „source of truth”.
2. Auth + RBAC (`BE-04..BE-06`)
3. Prisma schema refactor + migracje + seed (`BE-01`, `BE-07`)
4. Books (`BE-08..BE-10`)
5. Loans (`BE-11..BE-14`)
6. Users admin (`BE-15..BE-17`)
7. Stabilizacja OpenAPI + testy (`BE-18..BE-20`)

---

# Backlog Issues (BE)

## EPIC BE-00 — Ujednolicenie domeny MVP vs stan repo (P0)

### BE-01 (P0) — Refactor Prisma schema do MVP (User/Book/Loan)
**Opis:**
- Dostosuj `schema.prisma` do modelu MVP (usuń pola spoza zakresu MVP albo oznacz jako „po MVP” i nie eksponuj).
- Przyjmij jedną konwencję nazw (`loanDate/returnDate`).

**Zakres:**
- `User`: usuń `firstName/lastName` (po MVP).
- `Book`: usuń `copiesTotal/copiesAvailable`, `publishedYear` (po MVP).
- `Loan`: usuń `dueDate` (po MVP), ujednolić pola dat.

**AC:**
- `prisma validate` przechodzi
- `db:migrate` przechodzi na czystej bazie
- seed (`BE-07`) działa z nowym schema

**Uwagi:**
- Jeśli typ `id` pozostaje UUID — OK (jeżeli FE i kontrakt akceptują string id).

### BE-02 (P0) — Wprowadzenie envelope `{success,data}` / `{success,error}`
**Opis:**
- Zmień wszystkie odpowiedzi API na spójny kontrakt.

**AC:**
- `/api/health`, `/api/books` zwracają envelope
- `404` zwraca `{success:false, error:{...}}` zamiast `{error:"not_found"}`

### BE-03 (P0) — Globalny handler błędów + mapowanie HTTP/409
**Opis:**
- Wprowadź typy błędów domenowych + mapper na HTTP.
- Zmapuj w szczególności konflikty (`409`) do powtarzalnych `error.code`.

**AC:**
- `400/401/403/404/409/500` mają spójny format
- brak stacktrace w odpowiedzi

---

## EPIC BE-01 — Fundamenty app (P0/P1)

### BE-04 (P0) — Konfiguracja auth: JWT sign/verify + env
**Opis:**
- Dodaj `JWT_SECRET`, `JWT_EXPIRES_IN`.
- Dodaj utilsy: sign/verify i typ `req.user`.

**AC:**
- token zawiera `sub` i `role`
- brak/niepoprawny token → `401`

### BE-05 (P0) — `POST /api/auth/register`
**AC:**
- walidacja email + hasło min. 6
- konflikt email → `409 EMAIL_TAKEN`
- decyzja: token po register = `DO POTWIERDZENIA` (opisz w OpenAPI)

### BE-06 (P0) — `POST /api/auth/login`
**AC:**
- złe dane → `401`
- poprawne → `{token, user:{id,email,role}, expiresIn}`

---

## EPIC BE-02 — DB workflow + seed (P0/P1)

### BE-07 (P0) — Seed MVP (admin + users + books + kilka loanów)
**AC:**
- `npm run db:seed` działa (lokalnie i w compose)
- seed tworzy:
  - 1 admin + 1–2 userów
  - 20–50 książek
  - kilka wypożyczeń (aktywne + zwrócone)

---

## EPIC BE-03 — Books (P0)

### BE-08 (P0) — `GET /api/books` (page/limit/search/sort)
**AC:**
- `limit` whitelist: `10/20/50/100` (lub jawnie opisany zakres)
- `search` działa na `title/author/isbn` (OR)
- `sortBy` whitelist + `order` `asc/desc`
- response:
  - `items[]` zawiera `isAvailable`
  - meta: `page`, `limit`, `total`, `totalPages`

### BE-09 (P0) — `POST /api/books` (ADMIN)
**AC:**
- wymaga JWT + `ADMIN`
- duplikat ISBN → `409 ISBN_TAKEN`
- `201` zwraca Book DTO (bez pól spoza MVP)

### BE-10 (P0) — `PUT /api/books/:id` i `DELETE /api/books/:id` (ADMIN)
**AC:**
- update: `200`; `404` jeśli brak; `409` przy konflikcie ISBN
- delete: `204`; `409 BOOK_HAS_ACTIVE_LOAN` gdy aktywne wypożyczenie

---

## EPIC BE-04 — Loans (P0)

### BE-11 (P0) — `POST /api/loans` (borrow)
**AC:**
- tylko zalogowany
- jeśli książka ma aktywne wypożyczenie → `409 BOOK_NOT_AVAILABLE`
- `201` tworzy loan powiązany z `req.user.id`

**Ważne (race condition):**
- zabezpiecz przed podwójnym aktywnym wypożyczeniem tej samej książki (transakcja + mechanizm DB).
- rekomendacja: partial unique index na `Loan(bookId)` gdzie `returnDate is null` (raw SQL migration) i mapowanie naruszenia na `409`.

### BE-12 (P0) — `PUT /api/loans/:id/return` (return)
**AC:**
- owner lub `ADMIN`
- obcy `USER` → `403`
- `404` gdy brak
- jeśli już zwrócone:
  - preferencja: idempotentnie `200` (`DO POTWIERDZENIA`, ale rekomendowane dla UX)
- po zwrocie `returnDate` ustawione

### BE-13 (P0) — `GET /api/loans/me`
**AC:**
- zwraca aktywne + historia (np. `active[]` i `history[]`)
- sort: aktywne po dacie wypożyczenia desc

### BE-14 (P1) — `GET /api/loans` (ADMIN)
**AC:**
- `USER` → `403`
- domyślnie zwraca aktywne; opcjonalnie `status=all`
- zawiera minimalne dane usera i książki (email + title/isbn)

---

## EPIC BE-05 — Users (ADMIN) (P1)

### BE-15 (P1) — `GET /api/users` (ADMIN)
**AC:**
- lista userów (bez hasła) + `activeLoansCount`
- agregacja bez N+1

### BE-16 (P1) — `DELETE /api/users/:id` (ADMIN) z ograniczeniami
**AC:**
- aktywne wypożyczenia → `409 USER_HAS_ACTIVE_LOANS`
- self-delete → `403` (polityka)
- `204` gdy usunięto

---

## EPIC BE-06 — OpenAPI/Swagger (P0/P1)

### BE-17 (P0) — Rozbudowa OpenAPI do pełnego MVP
**AC:**
- `/api/docs` zawiera wszystkie endpointy MVP
- schemat bearer auth
- przykłady `409/401/403`

---

## EPIC BE-07 — Testy krytycznych ścieżek (P1)

### BE-18 (P1) — Testy integracyjne: Auth

### BE-19 (P1) — Testy integracyjne: Books

### BE-20 (P1) — Testy integracyjne: Loans + race condition (min. symulacja)
**AC:**
- testy działają w CI i lokalnie (compose)

---

## Notatki implementacyjne dla zespołu BE

### Wymagane DTO / kontrakty odpowiedzi
- Każdy endpoint powinien być odwzorowany w OpenAPI.
- Envelope odpowiedzi musi być spójny globalnie.
- `204 No Content` nie zwraca body.
- Wszystkie błędy biznesowe `409` muszą mieć stabilne `error.code`.

### Minimalne wymagania bezpieczeństwa
- hasła hashowane (`bcrypt` lub równoważne),
- brak ekspozycji `passwordHash`,
- JWT w `Authorization: Bearer`,
- RBAC enforced na middleware/controller/service,
- brak sekretów w repo i commitach.

### Minimalne wymagania testowe
- test happy path dla auth/books/loans,
- test `401/403/404/409`,
- test regresyjny dla race condition przy borrow,
- test compose-based zgodny z root scripts.

---

## Finalny cel tego pliku

Ten dokument ma być pojedynczym źródłem roboczym dla zespołu BE do realizacji MVP w `library3`, tak aby:
- kontrakt API był spójny,
- backlog był gotowy do rozbicia na małe PR-y,
- OpenAPI i implementacja mogły być rozwijane równolegle,
- integracja FE ↔ BE była przewidywalna,
- decyzje niejawne były oznaczone jako `DO POTWIERDZENIA`, zamiast pozostawać ukrytymi.
