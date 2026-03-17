# KM5 — Loans + Users API

## Cel

Domknąć ścieżki biznesowe USER i ADMIN po stronie backendu: wypożyczanie, zwroty, „moje wypożyczenia”, lista wypożyczeń oraz zarządzanie użytkownikami.

## Zakres

### Backend — Loans
- `POST /api/loans` (zalogowany),
- `PUT /api/loans/:id/return` (owner lub ADMIN),
- `GET /api/loans/me`,
- `GET /api/loans` (ADMIN),
- polityka idempotencji dla zwrotu,
- zabezpieczenie przed race condition przy wypożyczeniu,
- 409 gdy książka jest już zajęta.

### Backend — Users
- `GET /api/users` (ADMIN),
- `GET /api/users/:id` (ADMIN),
- `DELETE /api/users/:id` (ADMIN),
- brak danych wrażliwych w DTO,
- blokada self-delete,
- blokada usuwania użytkownika z aktywnymi wypożyczeniami.

### Wspólne
- pełne przykłady Swagger dla `loans` i `users`,
- doprecyzowanie payloadów pod FE admina i widok „Moje wypożyczenia”.

## Issue do założenia

### Backend
- **BE-C4:** DTO Loans
- **BE-G1:** `POST /api/loans`
- **BE-G2:** `PUT /api/loans/:id/return`
- **BE-G3:** `GET /api/loans/me`
- **BE-G4:** `GET /api/loans`
- **BE-G5:** admin „oznacz jako zwrócone”
- **BE-H1:** `GET /api/users`
- **BE-H2:** `GET /api/users/:id`
- **BE-H3:** `DELETE /api/users/:id`
- **BE-K3:** testy integracyjne loans
- **BE-K4:** testy integracyjne users

### Frontend
- **M5-01:** UX constraints dla 403/409 w loans/users
- **M5-02:** potwierdzenie pól dla list admina i widoku `my loans`

## Definition of Done
- USER może wypożyczyć dostępną książkę i zwrócić własną,
- ADMIN widzi listę wszystkich aktywnych wypożyczeń,
- ADMIN widzi listę użytkowników i może usuwać tylko dozwolone konta,
- brak wrażliwych pól w odpowiedziach,
- testy regresyjne dla race condition i ograniczeń biznesowych przechodzą.

## Weryfikacja
```bash
docker compose up --build -d
docker compose exec backend npm run db:seed
docker compose run --rm backend npm test
curl -s -X POST http://localhost:4000/api/loans \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"bookId":"<BOOK_ID>"}'
curl -s -X PUT http://localhost:4000/api/loans/<LOAN_ID>/return \
  -H "Authorization: Bearer <USER_JWT>"
curl -s http://localhost:4000/api/loans/me \
  -H "Authorization: Bearer <USER_JWT>"
curl -s http://localhost:4000/api/users \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

## Ryzyka
- wyścig przy podwójnym wypożyczeniu,
- niejednoznaczna polityka „already returned”,
- zbyt ciężkie agregacje dla list admina.

## Następny KM
Po domknięciu backendu przechodzimy do **KM6 — Fundamenty FE i integracja auth/API**.
