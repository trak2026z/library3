# KM7 — Frontend publiczny i USER flow

## Cel

Dowieźć pełny flow użytkownika końcowego w UI: przeglądanie katalogu, rejestracja, logowanie, wypożyczenie, podgląd własnych wypożyczeń i zwrot.

## Zakres

### Frontend
- `/` — katalog książek:
  - tabela/lista,
  - status dostępności,
  - search,
  - sort,
  - paginacja,
  - limity 10/20/50/100,
- `/login`,
- `/register`,
- `/loans`,
- `LoanModal`,
- `Toast/Banner`,
- loading / disabled / empty / error states,
- czytelne komunikaty dla 401/403/409,
- aktualizacja UI po wypożyczeniu i zwrocie.

### Backend
- tylko korekty payloadów lub statusów, jeśli wyjdą na jaw podczas integracji,
- bez łamania ustalonego kontraktu.

## Issue do założenia

### Frontend
- **US-01:** przeglądanie katalogu książek
- **US-02:** wyszukiwanie książek
- **US-03:** paginacja i limit rekordów
- **US-04:** rejestracja konta
- **US-05:** logowanie do systemu
- **US-09:** wypożyczenie książki
- **US-10:** blokada wypożyczenia niedostępnej
- **US-11:** moje wypożyczenia
- **US-12:** zwrot książki
- **US-19:** system komunikatów
- **US-20:** loading i blokady akcji
- **FE-G4:** empty/error states
- **FE-H1-part1:** testy krytycznych ścieżek public/USER

### Backend
- **M7-01:** payload tweaks pod UX, bez breaking changes

## Definition of Done
- gość może przeglądać katalog bez logowania,
- użytkownik może się zarejestrować i zalogować,
- użytkownik może wypożyczyć dostępną książkę,
- użytkownik może zobaczyć aktywne i historyczne wypożyczenia,
- użytkownik może zwrócić książkę,
- UI nie pozwala na podwójne akcje i poprawnie pokazuje błędy.

## Weryfikacja
```bash
docker compose up --build
docker compose run --rm frontend npm test
curl -s http://localhost:3000/
```

## Ryzyka
- niespójność odświeżania stanu po akcjach mutujących,
- zbyt duża logika w stronach zamiast w feature/service,
- brak rozróżnienia błędu domenowego od błędu sieci.

## Następny KM
Po USER flow przechodzimy do **KM8 — frontend admin + stabilizacja MVP**.
