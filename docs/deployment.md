# Deployment — monorepo / Library3 (Docker Compose, GHCR, Azure VM)

Niniejszy dokument stanowi **ujednoliconą instrukcję wdrażania** dla aplikacji utrzymywanej w monorepo (np. `frontend/`, `backend/`, `infra/`, `docs/`) oraz dla wariantu produkcyjnego uruchamianego na **Azure VM** z obrazami publikowanymi do **GHCR**.

Zakres:
- lokalny development (Docker Compose, hot-reload)
- budowanie i publikacja obrazów (CI -> GHCR)
- wdrożenie produkcyjne (Docker Compose na VM; opcjonalnie Swarm jako kierunek rozwoju)
- cykl życia bazy danych (migracje + seed) oraz strategia wydań i rollback

---

## 1) Repozytorium i podstawowe założenia

**Struktura monorepo (przykład):**
- `frontend/` — aplikacja FE
- `backend/` — API / usługi backendowe
- `infra/` — pliki infrastrukturalne (Compose, skrypty, proxy itp.)
- `docs/` — dokumentacja

**Topologia runtime (zalecana, single host):**
- publicznie wystawiony wyłącznie **frontend** (HTTP/80 lub inny port z `.env`)
- **backend** i **db** dostępne wyłącznie w sieci dockerowej (bez publicznych portów)

---

## 2) Środowiska

### 2.1 Local dev (Docker Compose)

Cel: szybkie uruchomienie FE+BE+DB lokalnie z hot-reload.

**Pliki (warianty spotykane w repo):**
- `docker-compose.yml` (często wystarcza do dev, np. z targetami `dev`)
- lub `docker-compose.dev.yml` (jeżeli dev jest wydzielony)

**Typowe porty lokalne:**
- `3000` — frontend
- `4000` — backend
- `5434` — baza danych wystawiona na hosta (tylko lokalnie)

**Start (przykład):**
```bash
docker compose up --build
```

Jeśli repo ma skrypty npm (opcjonalnie): `npm run dev:up`, `npm run dev:down`, `npm run dev:logs`.

### 2.2 Production (Docker Compose na VM)

Cel: uruchomienie stabilne i powtarzalne na serwerze (VM).

**Pliki produkcyjne:**
- `docker-compose.prod.yml` — runtime (db, backend, frontend)
- `docker-compose.prod.init.yml` — profile `init` (migracje + seed)
- `.env.prod.example` — przykład konfiguracji (bez sekretów)
- `.env` — realna konfiguracja na serwerze (poza repo, ignorowana przez git)

---

## 3) Konfiguracja i sekrety

### 3.1 `.env` / `.env.example`

Zasada:
- w repo trzymamy wyłącznie `.env.example`/`.env.prod.example` z placeholderami
- na serwerze istnieje wyłącznie `.env` z właściwymi sekretami

**Minimalne zmienne dla produkcji (przykład):**
```env
GHCR_OWNER=trak2026z
IMAGE_TAG=latest
PUBLIC_HTTP_PORT=80

POSTGRES_PASSWORD=CHANGE_ME_STRONG
JWT_SECRET=CHANGE_ME_STRONG
```

Uwagi:
- `IMAGE_TAG` zalecane: `sha-<commit_sha>` dla deterministycznych wdrożeń i rollbacków
- `PUBLIC_HTTP_PORT` określa port publikowany przez frontend

### 3.2 Sekrety w CI/CD (GitHub Actions)

Dla deployu przez SSH na Azure VM (przykład zestawu):
- `AZURE_VM_HOST`
- `AZURE_VM_USER`
- `AZURE_VM_SSH_KEY`
- `AZURE_VM_KNOWN_HOSTS`
- `GHCR_USER`
- `GHCR_TOKEN_READ` (PAT z `read:packages`)

---

## 4) CI/CD — przegląd logiczny

### 4.1 Quality Gate (CI repo)

Cel: zatrzymać regresje przed budową obrazów.
Typowy zestaw kroków:
- lint
- typecheck
- tests
- build
- (opcjonalnie) `docker compose build` jako sanity-check

### 4.2 Build & Push images (GHCR)

Workflow (przykład): `.github/workflows/publish-ghcr.yml`

Publikowane obrazy (przykład nazewnictwa):
- `ghcr.io/<owner>/library3-backend:<tag>`
- `ghcr.io/<owner>/library3-backend-init:<tag>` (migrate/seed)
- `ghcr.io/<owner>/library3-frontend:<tag>`

**Tagowanie:**
- `latest` — wygodne w MVP
- `sha-<commit_sha>` — zalecane do wdrożeń produkcyjnych (rollback przez zmianę taga)

### 4.3 Deploy (Azure VM)

Workflow (przykład): `.github/workflows/deploy-azure-vm.yml`

Tryby uruchomienia:
- automatycznie po sukcesie `publish-ghcr` (trigger `workflow_run`)
- ręcznie (trigger `workflow_dispatch`)

Kroki (logicznie):
1. `git pull` na VM (by mieć aktualne pliki Compose/infra)
2. `docker login ghcr.io`
3. `docker compose pull`
4. migracje DB (init)
5. opcjonalnie seed DB (init)
6. `up -d` usług runtime
7. smoke test (np. `/api/health`)

---

## 5) Produkcja — ręczny deploy na VM (procedura referencyjna)

Założenia:
- kod i pliki Compose na VM w katalogu np. `/opt/library3`
- plik `.env` na VM zawiera sekrety i ustawienia (`GHCR_OWNER`, `IMAGE_TAG`, `PUBLIC_HTTP_PORT`, itd.)

Polecenia:
```bash
cd /opt/library3

# pull
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env pull

# migrate
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env --profile init run --rm -T migrate </dev/null

# seed (tylko pierwszy raz lub świadomie na żądanie)
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env --profile init run --rm -T seed </dev/null

# up
docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans db backend frontend
docker compose -f docker-compose.prod.yml --env-file .env ps --all
```

**Uwaga dot. SSH/heredoc:** przy uruchamianiu `docker compose run` w skryptach wykonywanych przez SSH stosuj `-T` oraz `</dev/null` — w przeciwnym razie stdin może zostać „skonsumowane”, co potrafi uciąć skrypt deployu.

---

## 6) Cykl życia bazy danych

### 6.1 Migracje

- wykonywane przy każdym deployu (np. `prisma migrate deploy` w kontenerze `migrate`)
- muszą być **idempotentne**
- preferuj migracje „forward-only” (kompatybilne wstecz lub kontrolowane okna zmian)

### 6.2 Seed

- uruchamiany **wyłącznie** przy pierwszym wdrożeniu lub świadomie „na żądanie”
- nie uruchamiać automatycznie przy każdym deployu

**Pierwsze wdrożenie (seed) — procedura operacyjna:**
1. Na VM przygotuj `/opt/library3` oraz `.env` z sekretami.
2. W GitHub Actions uruchom `deploy-azure-vm` z parametrami:
   - `image_tag`: `latest` lub `sha-...`
   - `run_seed`: `true`
3. Kolejne wdrożenia wykonuj z `run_seed=false`.

---

## 7) Strategia wydań i rollback

**Zalecenie:**
- wdrażaj produkcję z `IMAGE_TAG=sha-<commit_sha>` (deterministyczne wdrożenie/rollback)
- `latest` traktuj jako skrót dla MVP lub środowisk niekrytycznych

**Rollback:**
1. Ustaw `IMAGE_TAG=sha-<previous>` w `.env` na VM.
2. Wykonaj `pull` + `up -d`.

Uwaga: rollback DB jest możliwy tylko, jeśli migracje były projektowane pod kompatybilność wstecz lub masz zaplanowane procedury odwracania (w praktyce często preferuje się migracje forward-only + kontrolę kompatybilności aplikacji).

---

## 8) Skalowanie (opcjonalnie)

Potencjalne kierunki rozwoju:
- Docker Swarm (manager + workers)
- DB na osobnym hoście / managed DB
- ingress/proxy + TLS (np. Traefik)

---

## 9) Checklist troubleshooting

- stan usług:
  ```bash
  docker compose ps --all
  ```
- logi:
  ```bash
  docker compose logs --tail=200 <service>
  ```
- smoke test:
  ```bash
  curl http://localhost/api/health
  ```
- weryfikacja:
  - porty i firewall/NSG na VM
  - poprawność `IMAGE_TAG` i istnienie obrazów w GHCR
  - poprawność `.env` oraz dostęp do sekretów
