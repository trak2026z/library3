# KM3 — Auth, JWT i RBAC

## Cel

Dowieźć pełny moduł autentykacji i autoryzacji, tak aby backend miał gotowy fundament pod wszystkie ścieżki USER/ADMIN.

## Zakres

### Backend
- `POST /api/auth/register`,
- `POST /api/auth/login`,
- opcjonalnie `GET /api/auth/me`,
- hashowanie haseł (`bcrypt`),
- JWT z `sub` i `role`,
- middleware Bearer JWT,
- `req.user` w typowanym kształcie,
- middleware RBAC:
  - `requireAdmin`
  - opcjonalnie `requireRole(...roles)`,
- spójne odpowiedzi 401/403,
- DTO i walidacja:
  - email,
  - hasło min. 6 znaków,
  - czytelne błędy użytkowe.

### Frontend
- doprecyzowanie payloadu logowania pod NextAuth Credentials,
- ustalenie mapowania błędów auth na UI,
- przygotowanie minimalnego kontraktu sesji dla KM6.

## Issue do założenia

### Backend
- **BE-C2:** DTO Auth (RegisterDto, LoginDto)
- **BE-D1:** JWT tools
- **BE-D2:** AuthMiddleware: Bearer + `req.user`
- **BE-D3:** RoleMiddleware / `requireAdmin`
- **BE-D4:** hashowanie haseł i brak wycieku
- **BE-E1:** `POST /api/auth/register`
- **BE-E2:** `POST /api/auth/login`
- **BE-K1:** testy integracyjne auth

### Frontend / wspólne
- **FE-A0-auth-note:** note do integracji NextAuth Credentials
- **M3-01:** contract note dla sesji i nagłówka `Authorization: Bearer`

## Definition of Done
- rejestracja tworzy użytkownika USER,
- logowanie zwraca token i dane użytkownika,
- błędne dane logowania dają 401,
- duplikat email daje 409,
- endpoint admin-only zwraca 403 dla USER,
- testy integracyjne auth przechodzą lokalnie i w CI.

## Weryfikacja
```bash
docker compose up --build -d
docker compose exec backend npm run db:seed
docker compose run --rm backend npm test
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password123"}'
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## Ryzyka
- niespójność TTL tokena między kodem i Swaggerem,
- wycieki danych wrażliwych do logów lub odpowiedzi,
- zbyt późne dopięcie typów `req.user`.

## Następny KM
Po auth przechodzimy do **KM4 — Books API do poziomu MVP**.
