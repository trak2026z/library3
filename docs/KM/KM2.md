# KM2 — Kontrakt integracyjny i normalizacja fundamentów

## Cel

Domknąć rozjazdy między dokumentacją a aktualnym repo tak, aby dalsze prace nad FE i BE były wykonywane na **jednym, stabilnym kontrakcie**.

## Dlaczego teraz

Po KM1 repo ma już fundamenty techniczne i deploy, ale nadal są rozbieżności w:
- formacie odpowiedzi API,
- parametrach paginacji/sortowania,
- nazewnictwie pól domenowych,
- kontrakcie env i komunikacji FE ↔ BE,
- strukturze OpenAPI.

Bez tego kolejne KM będą generować poprawki zamiast postępu.

## Zakres

### Wspólne
- potwierdzenie jednego kontraktu odpowiedzi:
  - sukces: `{ success: true, data: ... }`
  - błąd: `{ success: false, error: { code, message, details? } }`
- potwierdzenie query dla list:
  - `page`
  - `limit`
  - `search`
  - `sortBy`
  - `order`
- potwierdzenie polityki kodów błędów: `400/401/403/404/409/500`,
- spis decyzji domenowych i technicznych w jednym dokumencie w repo.

### Backend
- ujednolicenie kontraktu istniejących endpointów do formatu z dokumentacji,
- decyzja i opis nazewnictwa domenowego:
  - `loanDate/returnDate` vs `borrowedAt/returnedAt`,
  - `isAvailable` vs `copiesAvailable/copiesTotal`,
  - `limit/order` vs `pageSize/sortDir`,
- aktualizacja Swagger/OpenAPI jako źródła prawdy.

### Frontend
- ujednolicenie env:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
- spis kontraktów DTO i serwisów, na których będzie oparty FE,
- usunięcie „domysłów” po stronie komponentów.

## Issue do założenia

### Wspólne
- **M2-01:** kontrakt API i decyzje domenowe
- **M2-02:** contract note w README + docs

### Backend
- **BE-A4:** standard odpowiedzi + global error handler
- **BE-C1:** walidacja body/query/params
- **BE-C5:** DTO query dla list książek
- **BE-I1:** Swagger UI pod `/api/docs`
- **BE-I2:** przykłady request/response + kody błędów

### Frontend
- **FE-A0:** spójność `/api/` i base URL
- **FE-A4:** konfiguracja `.env` i runtime
- **FE-21:** klient API + serwisy + typy

## Definition of Done
- istnieje jeden dokument kontraktu technicznego w repo,
- istniejące endpointy używają docelowego formatu sukces/błąd,
- OpenAPI odzwierciedla realne payloady i query params,
- FE i BE używają tej samej terminologii,
- `docker compose up --build` działa bez regresji.

## Weryfikacja
```bash
docker compose up --build
curl -s http://localhost:4000/api/health
curl -s "http://localhost:4000/api/books?page=1&limit=10&search=&sortBy=title&order=asc"
docker compose run --rm backend npm run lint
docker compose run --rm backend npm run typecheck
docker compose run --rm frontend npm run lint
docker compose run --rm frontend npm run typecheck
```

## Ryzyka
- przeciąganie „dyskusji o nazewnictwie”,
- równoległe zmiany FE/BE bez zamrożenia kontraktu,
- przypadkowe utrwalenie niezgodnych payloadów w testach.

## Następny KM
Po zamknięciu kontraktu przechodzimy do **KM3 — Auth + JWT + RBAC**.
