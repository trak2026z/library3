# KM9 — Hardening operacyjny produkcji

## Cel

Po dowiezieniu MVP ustabilizować środowisko produkcyjne i proces wdrożeń tak, aby aplikacja była nie tylko działająca, ale też bezpieczniejsza i łatwiejsza w utrzymaniu.

## Dlaczego jako osobny KM

Repo ma już:
- CI,
- build/push do GHCR,
- deploy na Azure VM,
- runbook operacyjny.

Brakuje jednak domknięcia tematów operacyjnych „po MVP”, które zwykle są odkładane, a potem bolą najbardziej.

## Zakres

### DevOps / Operacje
- backup/restore PostgreSQL i test odtworzenia,
- split `health` / `ready`, jeśli okaże się potrzebny operacyjnie,
- checklista rollbacku z ćwiczeniem na prawdziwym tagu,
- hardening sekretów i rotacji,
- dependabot / scan sekretów / scan obrazów,
- release tagging i procedura wydania,
- monitoring minimum:
  - health,
  - logi backend/frontend,
  - status usług po deployu.

### Backend / Frontend
- bezpieczne logowanie bez PII,
- czytelne komunikaty operacyjne w runbooku,
- dopięcie smoke testów po deployu.

## Issue do założenia

### DevOps
- **DO-E3+:** stabilność deploy skryptu i rollback drill
- **DO-F1:** secret scanning / dependency scanning / image scanning
- **DO-F2:** release tagging + checklist
- **DO-F3:** backup/restore runbook dla DB
- **DO-F4:** monitoring i smoke checks po deployu

### Backend / Frontend
- **M9-01:** request id / structured logging
- **M9-02:** produkcyjne smoke testy FE + BE

## Definition of Done
- da się odtworzyć bazę z backupu,
- rollback do poprzedniego tagu jest opisany i sprawdzony,
- obrazy i zależności są skanowane,
- po deployu istnieje jednoznaczna checklista zdrowia systemu,
- dokumentacja operacyjna jest aktualna i zrozumiała.

## Weryfikacja
```bash
# VM / prod
docker compose -f docker-compose.prod.yml --env-file .env ps --all
curl -i http://localhost/api/health

# backup / restore
pg_dump ...
psql ...

# smoke po deployu
curl -i http://<PUBLIC_IP>/
curl -i http://<PUBLIC_IP>/api/health
```

## Ryzyka
- przekładanie hardeningu „na później”,
- brak testu realnego rollbacku,
- zbyt duża zależność od wiedzy jednej osoby o wdrożeniu.

## Efekt końcowy
Po KM9 projekt ma:
- działające MVP,
- stabilny tor release,
- czytelną eksploatację,
- mniejsze ryzyko regresji i awarii wdrożeniowej.
