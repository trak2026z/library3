# docs/ISSUES_DEVOPS.md

# Issues DevOps (library3)

Dokument zawiera listę tematów DevOps w formie EPIC → Issue → AC (Acceptance Criteria).
Zakres jest dopasowany do tego, co faktycznie zostało wdrożone w repo `trak2026z/library3`.

---

## EPIC DO-A — Repo, standardy pracy i “quality gate” (foundation)

### DO-A1. Szablony PR + podstawowa obsługa pracy w GitHub
AC:
- istnieje PR template w repo
- workflow CI jest uruchamiany na `push` i `pull_request`

### DO-A2. Ujednolicone skrypty monorepo (root scripts)
Zakres: agregaty dla FE/BE z root poziomu.
AC:
- z root poziomu da się uruchomić: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
- polecenia uruchamiają FE i BE w spójny sposób (przez `docker compose run`)

### DO-A3. Quality Gate (CI) dla FE+BE
Zakres: lint + typecheck + test + build + compose build.
AC:
- istnieje workflow CI wykonujący `docker compose build` oraz `npm run lint/typecheck/test/build`
- pipeline kończy się niepowodzeniem przy błędach lint/type/test/build
- po jobie wykonywany jest cleanup (`docker compose down -v`)

---

## EPIC DO-B — Local Dev: Docker Compose (dev UX)

### DO-B1. Local dev przez Docker Compose (FE/BE/DB)
AC:
- `docker compose up --build` stawia `db`, `backend`, `frontend`
- `backend` łączy się z bazą po `db:5432`
- `frontend` ma proxy `/api/*` do `backend` (przez `API_PROXY_TARGET` + rewrites)

### DO-B2. Healthchecki i kolejność startu w dev
AC:
- `db` ma healthcheck (`pg_isready`)
- `backend` ma healthcheck (`/api/health`)
- `frontend` ma healthcheck (HTTP)
- `backend` zależy od zdrowego `db`, a `frontend` od zdrowego `backend` (w compose)

### DO-B3. Skrypty operacyjne dev (root)
AC:
- istnieją skrypty: `dev:up`, `dev:down`, `dev:logs`
- istnieją skrypty agregujące FE/BE: `lint`, `typecheck`, `test`, `build`

---

## EPIC DO-C — Standard obrazów i tagowania (Dockerfile/konwencje)

### DO-C1. Multi-stage Dockerfile dla FE i BE
AC:
- `frontend/Dockerfile` ma targety `dev` i `prod`
- `backend/Dockerfile` ma targety `dev` i `prod`
- obrazy działają jako non-root (`USER node`)
- runtime ma healthchecki

### DO-C2. Wymuszenie poprawnego proxy w produkcji (Next.js)
AC:
- `frontend` w produkcji nie używa domyślnego `http://localhost:4000` jako targetu proxy
- `API_PROXY_TARGET` jest ustawiany na etapie build (lub przekazywany jako build-arg) tak, aby w kontenerze wskazywał `http://backend:4000`

### DO-C3. Obraz inicjalizacyjny dla migracji i seeda
AC:
- istnieje target `init` w `backend/Dockerfile` przeznaczony do zadań jednorazowych
- `init` pozwala uruchomić `db:migrate` i `db:seed` (prisma CLI dostępne)

---

## EPIC DO-D — Prod runtime: Docker Compose (single host)

### DO-D1. Pliki produkcyjne compose
AC:
- istnieje `docker-compose.prod.yml` dla runtime (db/backend/frontend)
- istnieje `docker-compose.prod.init.yml` dla zadań init (migrate/seed)
- istnieje `.env.prod.example` jako szablon konfiguracji (bez commitowania `.env`)

### DO-D2. Procedura init DB w prod
AC:
- migracje wykonują się przez `migrate` (init)
- seed jest wykonywany opcjonalnie (tylko na pierwszym wdrożeniu lub ręcznie)

---

## EPIC DO-E — GitHub Actions: publikacja obrazów i deploy

### DO-E1. Publikacja obrazów do GHCR
AC:
- istnieje workflow `publish-ghcr` budujący i publikujący obrazy:
  - `library3-backend`
  - `library3-backend-init`
  - `library3-frontend`
- tagowanie obejmuje `latest` oraz `sha-<commit>`

### DO-E2. Deploy na Azure VM przez SSH (Compose)
AC:
- istnieje workflow `deploy-azure-vm` uruchamiany po sukcesie `publish-ghcr` oraz ręcznie (`workflow_dispatch`)
- deploy wykonuje: `pull` → `migrate` → (opcjonalnie `seed`) → `up -d` dla `db/backend/frontend`
- w deployu poprawnie przekazywane są zmienne do zdalnego skryptu (GHCR_USER/GHCR_TOKEN_READ/IMAGE_TAG/RUN_SEED)

### DO-E3. Stabilność deploy skryptu (SSH heredoc + compose run)
AC:
- `docker compose run` jest wykonywane z `-T` i `</dev/null`, aby nie przejmowało stdin skryptu przesyłanego po SSH
- deploy po `migrate` kontynuuje do `up -d` i weryfikuje zdrowie API (np. `/api/health`)

---