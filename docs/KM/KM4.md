# KM4 — Books API do poziomu MVP

## Cel

Domknąć publiczny katalog i administracyjne CRUD książek tak, aby backend dostarczał pełny moduł `books` zgodny z MVP.

## Zakres

### Backend
- `GET /api/books`
  - `page`
  - `limit`
  - `search`
  - `sortBy`
  - `order`
- `GET /api/books/:id`,
- `POST /api/books` (ADMIN),
- `PUT /api/books/:id` (ADMIN),
- `DELETE /api/books/:id` (ADMIN),
- `isAvailable` liczone na podstawie aktywnego wypożyczenia,
- search po `title/author/isbn`,
- paginacja z metadanymi,
- 409 dla konfliktu ISBN,
- 409 dla próby usunięcia książki z aktywnym wypożyczeniem,
- aktualizacja przykładów w Swagger.

### Frontend
- potwierdzenie kolumn, filtrów i sortowania potrzebnych do UI,
- walidacja, czy kontrakt API jest wystarczający dla widoku katalogu i panelu admina.

## Issue do założenia

### Backend
- **BE-C3:** DTO Book
- **BE-C5:** DTO query dla listy
- **BE-F1:** `GET /api/books`
- **BE-F2:** wyliczanie `isAvailable`
- **BE-F3:** `GET /api/books/:id`
- **BE-F4:** `POST /api/books`
- **BE-F5:** `PUT /api/books/:id`
- **BE-F6:** `DELETE /api/books/:id`
- **BE-K2:** testy integracyjne books

### Frontend
- **M4-01:** review payloadów books pod FE
- **M4-02:** decyzja, czy sort jest MUST czy SHOULD na pierwszym ekranie

## Definition of Done
- katalog publiczny działa na poziomie API bez logowania,
- admin może wykonać pełny CRUD książki,
- `isAvailable` jest zawsze obecne w DTO,
- response zawiera spójną paginację,
- 404/409 są spójne i opisane w Swagger.

## Weryfikacja
```bash
docker compose up --build -d
docker compose exec backend npm run db:seed
docker compose run --rm backend npm test
curl -s "http://localhost:4000/api/books?page=1&limit=10&search=harry&sortBy=title&order=asc"
curl -s http://localhost:4000/api/books/<BOOK_ID>
curl -s -X POST http://localhost:4000/api/books \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Nowa","author":"Autor","isbn":"9781234567897"}'
```

## Ryzyka
- N+1 przy liczeniu dostępności,
- rozjazd między `isAvailable` a rzeczywistą regułą biznesową,
- brak jednoznacznej polityki DELETE przy aktywnym wypożyczeniu.

## Następny KM
Po books przechodzimy do **KM5 — Loans + Users API**.
