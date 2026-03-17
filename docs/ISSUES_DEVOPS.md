# Issues DevOps — library3

Ten dokument opisuje backlog DevOps w formie EPIC → Issue → AC.
Repo posiada już fundamenty: Docker Compose (dev/prod), CI quality gate, GHCR publish, deploy na Azure VM.
Celem backlogu jest dopięcie braków i uszczelnienie procesu.

Zasada pracy:
`mały diff → compose-test → compose-run → commit → push → PR`.

---

## Definition of Done (DevOps)
- Compose dev i prod działają powtarzalnie.
- Sekrety nie trafiają do repo.
- CI blokuje regresje (lint/type/test/build + compose build).
- Deploy jest deterministyczny (tag sha), ma smoke test i rollback.

---

## EPIC DO-00 — Spójność FE (NextAuth) vs proxy backendu (P0)

### DO-01 (P0) — Zmiana proxy: `/api/*` -> `/_api/*` (wspólnie z FE)
Opis:
- Zaktualizuj `frontend/next.config.*` i dokumentację.
- Zaktualizuj przykłady curl i healthchecki, jeśli odwołują się do FE proxy.

AC:
- NextAuth działa (FE `/api/auth/*` nie jest proxy’owane)
- Backend nadal działa na `/api/*`
- FE używa `/_api/*` dla requestów do backendu

---

## EPIC DO-A — Repo / standardy / quality gate (utrzymanie)

### DO-A1 (P0) — Quality gate w CI (weryfikacja i utrzymanie)
Stan:
- Workflow `ci.yml` istnieje i uruchamia: compose build + lint/type/test/build.

Doprecyzowanie:
- Utrzymuj spójność wersji Node/Docker i czasę wykonania.
- Utrzymuj cleanup `down -v` po jobie.

AC:
- CI jest jedyną bramką merge (branch protection) — DO POTWIERDZENIA (ustawienia repo)

### DO-A2 (P1) — Issue templates (opcjonalnie)
AC:
- Repo ma folder `.github/ISSUE_TEMPLATE/*` z template dla: BE/FE/DevOps/bug

---

## EPIC DO-B — Local dev: Docker Compose UX

### DO-B1 (P0) — Compose dev E2E: FE/BE/DB
Stan:
- `docker-compose.yml` istnieje (db/backend/frontend + healthcheck).

AC:
- `docker compose up --build` → wszystkie serwisy healthy
- root scripts (lint/type/test/build) działają w compose

### DO-B2 (P1) — `.env.example` per komponent (backend + frontend)
AC:
- `backend/.env.example` (DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT, CORS_ORIGIN)
- `frontend/.env.example` (NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_API_BASE_URL / lub strategia proxy)
- dokumentacja mówi jednoznacznie, kiedy używać `host` vs `docker network`

---

## EPIC DO-C — Obrazy i “init” (migrate/seed)

### DO-C1 (P0) — Obraz `backend-init` do migracji/seed (utrzymanie)
Stan:
- `docker-compose.prod.init.yml` używa osobnego obrazu `library3-backend-init`.

AC:
- `migrate` używa `prisma migrate deploy`
- `seed` jest uruchamiany świadomie (pierwsze wdrożenie lub ręcznie)

### DO-C2 (P1) — Sanity-check migracji w CI (opcjonalnie)
AC:
- CI potrafi uruchomić `migrate` na tymczasowej DB (tylko jeśli czas pozwoli)

---

## EPIC DO-D — Produkcja (Compose na VM)

### DO-D1 (P0) — Utrzymanie plików prod compose
Stan:
- `docker-compose.prod.yml`, `docker-compose.prod.init.yml`, `.env.prod.example` istnieją.

AC:
- `db` nie ma publicznie wystawionego portu w produkcji
- `frontend` jest jedynym serwisem z portem publicznym

### DO-D2 (P0) — Procedura rollback
AC:
- rollback = zmiana `IMAGE_TAG` na poprzedni `sha-...` + `compose pull` + `up -d`
- opisane w `docs/DEPLOYMENT_RUNBOOK_library3.md`

---

## EPIC DO-E — GitHub Actions: GHCR + Azure VM

### DO-E1 (P0) — Publish GHCR
Stan:
- workflow `publish-ghcr.yml` buduje i publikuje 3 obrazy.

AC:
- tagi: `latest` i `sha-<commit>` (deterministyczne wdrożenia)

### DO-E2 (P0) — Deploy Azure VM
Stan:
- workflow `deploy-azure-vm.yml` jest obecny i ma smoke test `/api/health`.

AC:
- deploy robi: pull → migrate → (opcjonalnie seed) → up -d
- `docker compose run` używa `-T` i `</dev/null` (stabilność przez SSH)
- logi z backend/frontend drukowane przy failure

---

## EPIC DO-F — Security i utrzymanie (P1/P2)

### DO-F1 (P1) — Dependabot + podstawowe skany (opcjonalnie)
AC:
- dependabot dla npm + docker
- secret scanning włączone (ustawienia repo)

### DO-F2 (P2) — Backup/restore procedury DB (ops)
AC:
- opisane w `docs/DEPLOYMENT_RUNBOOK_library3.md` (pg_dump / restore / backup wolumenu)
