# KM8 — Frontend admin + stabilizacja MVP

## Cel

Dowieźć panel administratora oraz spiąć cały MVP w jeden spójny produkt gotowy do prezentacji, review i utrzymania.

## Zakres

### Frontend — Admin
- guard dla `/admin/*`,
- `/admin/books`
  - dodaj,
  - edytuj,
  - usuń,
  - obsługa 409,
- `/admin/loans`
  - lista aktywnych wypożyczeń,
  - „oznacz jako zwrócone”,
- `/admin/users`
  - lista użytkowników,
  - self-delete blocked,
  - active-loans blocked,
- `BookModal`,
- potwierdzenia akcji destrukcyjnych,
- spójne komunikaty i disabled states.

### Wspólne
- domknięcie testów krytycznych ścieżek,
- README uruchomienia FE/BE,
- smoke checklist MVP,
- release checklist dla merge do `main`.

## Issue do założenia

### Frontend
- **US-13:** admin dodaj/edytuj książkę
- **US-14:** admin usuń książkę
- **US-15:** admin lista wypożyczeń
- **US-16:** admin oznacz zwrot
- **US-17:** admin lista użytkowników
- **US-18:** admin usuwanie użytkownika z ograniczeniami
- **FE-G5:** a11y i ergonomia
- **FE-G6:** formatowanie dat
- **FE-H1-part2:** testy krytycznych ścieżek admin
- **FE-H2:** dokumentacja uruchomienia FE
- **FE-H3:** produkcyjny build

### Backend
- **M8-01:** doprecyzowanie payloadów admina, jeśli wyjdzie w praktyce
- **M8-02:** final Swagger examples dla admin paths

## Definition of Done
- admin utrzymuje katalog z poziomu UI,
- admin widzi aktywne wypożyczenia i może zamknąć wypożyczenie,
- admin zarządza użytkownikami zgodnie z ograniczeniami biznesowymi,
- dokumentacja pozwala uruchomić MVP nowej osobie,
- smoke test obejmuje public → USER → ADMIN.

## Weryfikacja
```bash
docker compose up --build
docker compose run --rm frontend npm run build
docker compose run --rm backend npm run build
docker compose run --rm frontend npm test
docker compose run --rm backend npm test
```

## Ryzyka
- zbyt szeroki zakres jednego PR dla admina,
- nieobsłużone 403/409 w akcjach destrukcyjnych,
- brak czytelnych komunikatów przy ograniczeniach domenowych.

## Następny KM
Po domknięciu MVP przechodzimy do **KM9 — hardening operacyjny produkcji**.
