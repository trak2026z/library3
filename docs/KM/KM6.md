# KM6 — Fundamenty frontendu i integracja auth/API

## Cel

Przebudować frontend z obecnego skeletonu do stanu, w którym FE ma stabilną architekturę, sesję, guardy i jeden sposób komunikacji z API.

## Zakres

### Frontend
- uporządkowana struktura:
  - `app/`
  - `components/`
  - `features/`
  - `lib/`
  - `types/`
- Tailwind i spójny layout,
- `Navbar`,
- klient API + serwisy + typy DTO,
- interceptory / wspólna obsługa 401/403/409,
- NextAuth Credentials + callbacks,
- env runtime:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
- route guards:
  - public,
  - user-only,
  - admin-only,
- brak „gołych requestów” w `app/*`.

### Backend
- drobne korekty CORS / auth contract pod FE,
- uzupełnienie Swagger przykładami auth.

## Issue do założenia

### Frontend
- **FE-A1:** inicjalizacja Next.js + TS + Tailwind
- **FE-A2:** konfiguracja jakości
- **FE-A3:** struktura katalogów i konwencje
- **FE-A4:** konfiguracja `.env`
- **FE-21:** klient API + serwisy + typy
- **US-06:** logowanie
- **US-07:** wylogowanie
- **US-08:** ochrona tras (RBAC w UI)

### Backend / wspólne
- **M6-01:** stabilizacja CORS i auth contract
- **M6-02:** Swagger auth examples dla FE

## Definition of Done
- FE uruchamia się bez błędów z `docker compose`,
- działa sesja przez NextAuth Credentials,
- FE umie wołać API przez jeden klient,
- route guards działają dla USER i ADMIN,
- komponenty nie robią ad-hoc requestów do backendu.

## Weryfikacja
```bash
docker compose up --build
docker compose run --rm frontend npm run lint
docker compose run --rm frontend npm run typecheck
docker compose run --rm frontend npm test
```

## Ryzyka
- mieszanie starego i nowego sposobu komunikacji z API,
- niejawne zależności env między buildem i runtime,
- rozjazd między sesją FE a JWT backendu.

## Następny KM
Po fundamentach FE przechodzimy do **KM7 — frontend publiczny + USER flow**.
