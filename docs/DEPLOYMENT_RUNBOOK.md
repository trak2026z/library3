# Deployment & Runbook — library3 (Docker Compose, GHCR, Azure VM)

Ten dokument łączy instrukcję wdrożenia i runbook operacyjny dla aplikacji `library3`
uruchamianej na Azure VM z użyciem Docker Compose oraz obrazów publikowanych do GHCR.

Zasada pracy:
`mały diff → compose-test → compose-run → commit → push → PR`

---

## 1. Cel i zakres

Dokument obejmuje:
- wdrożenie produkcyjne aplikacji `library3` na Azure VM,
- użycie Docker Compose dla runtime oraz zadań init (`migrate` / `seed`),
- wykorzystanie obrazów z GHCR,
- integrację z GitHub Actions,
- operacje utrzymaniowe: healthcheck, logi, rollback, backup/restore, recovery.

---

## 2. Kontekst repo

Monorepo:
- `frontend/`
- `backend/`
- `docs/`

Produkcja używa obrazów:
- `library3-frontend`
- `library3-backend`
- `library3-backend-init`

Topologia runtime (zalecana, single host):
- `frontend` — jedyny serwis wystawiony publicznie,
- `backend` — dostępny tylko w sieci dockerowej,
- `db` — PostgreSQL dostępny tylko w sieci dockerowej.

---

## 3. Prerekwizyty (Azure VM)

Wymagane:
- Docker Engine,
- Docker Compose v2,
- dostęp SSH do VM,
- katalog wdrożeniowy, np. `/opt/library3`,
- sklonowane repo lub co najmniej pliki compose,
- plik `.env` z realnymi sekretami poza repo.

Zalecana struktura na VM:
```bash
/opt/library3
├── docker-compose.prod.yml
├── docker-compose.prod.init.yml
├── .env
└── backups/
```

---

## 4. Pliki używane w produkcji

- `docker-compose.prod.yml` — runtime (`db`, `backend`, `frontend`)
- `docker-compose.prod.init.yml` — profile `init` (`migrate`, `seed`)
- `.env.prod.example` — przykład konfiguracji
- `.env` — realne sekrety na VM, niecommitowane do repo

---

## 5. Konfiguracja `.env`

Minimalny zestaw:
```env
GHCR_OWNER=trak2026z
IMAGE_TAG=sha-<commit_sha>
PUBLIC_HTTP_PORT=80

POSTGRES_PASSWORD=CHANGE_ME_STRONG
JWT_SECRET=CHANGE_ME_STRONG
```

Uwagi:
- `IMAGE_TAG=sha-<commit_sha>` jest zalecane dla deterministycznych wdrożeń i rollbacku,
- `IMAGE_TAG=latest` jest dopuszczalne w MVP, ale utrudnia rollback,
- baza danych w produkcji nie powinna wystawiać portu na hosta.

Dodatkowe zmienne mogą obejmować:
- `JWT_EXPIRES_IN`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

---

## 6. CI/CD (GitHub Actions)

Repo może wykorzystywać:
- quality gate CI: lint / typecheck / test / build / compose build,
- publikację obrazów do GHCR,
- deploy na VM przez SSH.

Zalecenie:
- produkcję wdrażać zawsze tagiem `sha-...`.

Logika deployu:
1. `pull` obrazów,
2. `migrate`,
3. opcjonalnie `seed`,
4. `up -d`,
5. smoke test.

---

## 7. Procedura wdrożenia na VM (manual)

### 7.1 Pull obrazów
```bash
cd /opt/library3
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env pull
```

### 7.2 Migracje
```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env --profile init run --rm -T migrate </dev/null
```

### 7.3 Seed
Uruchamiaj tylko przy pierwszym wdrożeniu lub świadomie:
```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env --profile init run --rm -T seed </dev/null
```

### 7.4 Start runtime
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans db backend frontend
docker compose -f docker-compose.prod.yml --env-file .env ps --all
```

---

## 8. Smoke test po wdrożeniu

### API health
```bash
curl -fsS http://localhost/api/health
```

### Swagger
- `http://<host>/api/docs`

### Frontend
- `http://<host>/`

Minimalny smoke test MVP:
- otwarcie katalogu,
- logowanie,
- wypożyczenie książki,
- zwrot książki.

---

## 9. Rollback

Rollback polega na powrocie do poprzedniego taga obrazu.

### Procedura
1. Zmień `IMAGE_TAG` w `.env` na poprzedni `sha-...`
2. Wykonaj:
```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans db backend frontend
```

Uwagi:
- rollback bazy danych jest trudniejszy niż rollback aplikacji,
- preferowane są migracje forward-only i kompatybilność wstecz.

---

## 10. Szybki skrót operacyjny (cheatsheet)

### Status usług
```bash
cd /opt/library3
docker compose -f docker-compose.prod.yml --env-file .env ps --all
```

### Logi
```bash
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 backend
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 frontend
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 db
```

### Healthcheck
```bash
curl -fsS http://localhost/api/health
```

### Restart bez migracji
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans db backend frontend
```

---

## 11. Architektura runtime

- `frontend` — jedyny serwis wystawiony publicznie,
- `backend` — API tylko w sieci dockerowej,
- `db` — PostgreSQL w sieci dockerowej, z trwałym wolumenem `db_data`.

---

## 12. Procedury operacyjne

### 12.1 Standardowe wdrożenie nowej wersji
1. Ustaw `IMAGE_TAG=sha-...` w `.env`
2. Wykonaj `pull`
3. Uruchom `migrate`
4. Uruchom `up -d`
5. Wykonaj smoke test

### 12.2 Rollback
Rollback = ustaw poprzedni `IMAGE_TAG` i wykonaj `pull` + `up -d`.

### 12.3 Restart usług
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans db backend frontend
```

---

## 13. Baza danych — backup / restore

### 13.1 Backup logiczny
Zalecany wariant dla MVP:
```bash
docker compose -f docker-compose.prod.yml --env-file .env exec -T db \
  pg_dump -U postgres -d library > /opt/library3/backups/library_$(date +%F_%H%M).sql
```

Uwagi:
- katalog `/opt/library3/backups` powinien istnieć,
- backup należy przechowywać także poza VM,
- polityka retencji backupów = DO POTWIERDZENIA.

### 13.2 Restore logiczny
```bash
cat /opt/library3/backups/library_YYYY-MM-DD_HHMM.sql | \
docker compose -f docker-compose.prod.yml --env-file .env exec -T db \
  psql -U postgres -d library
```

Ryzyko:
- restore na działającej aplikacji może prowadzić do niespójności,
- zalecane okno serwisowe.

---

## 14. Diagnostyka deployu i utrzymania

### Status kontenerów
```bash
docker compose -f docker-compose.prod.yml --env-file .env ps --all
```

### Logi
```bash
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 backend
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 frontend
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 db
```

### Health DB
```bash
docker compose -f docker-compose.prod.yml --env-file .env exec -T db pg_isready -U postgres -d library
```

### Ręczne uruchomienie migracji
```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env --profile init run --rm -T migrate </dev/null
```

---

## 15. Najczęstsze problemy

### Problem: `backend` unhealthy lub `/api/health` zwraca 503
Możliwe przyczyny:
- DB nie wstała,
- brak połączenia z DB,
- migracje nie zostały wykonane,
- błędny `DATABASE_URL`.

Kroki:
1. sprawdź logi `db` i `backend`,
2. sprawdź `pg_isready`,
3. uruchom migracje ręcznie.

### Problem: `frontend` działa, ale brak danych lub występują błędy 401
Możliwe przyczyny:
- niespójność ścieżek proxy (`/api` vs `/_api`),
- konflikt NextAuth z proxy,
- błędna konfiguracja rewrites.

Kroki:
1. sprawdź requesty w DevTools,
2. sprawdź logi `frontend`,
3. potwierdź konfigurację proxy w FE.

### Problem: deploy przez GitHub Actions nie kończy się przez SSH
Przyczyna:
- `docker compose run` przejmuje stdin skryptu wykonywanego przez SSH.

Rozwiązanie:
- uruchamiaj `docker compose run` z `-T` i `</dev/null`.

### Problem: brak `docker login` do GHCR
Kroki:
- sprawdź, czy token ma `read:packages`,
- upewnij się, że owner obrazu jest zapisany lowercase,
- wykonaj `docker logout ghcr.io` i zaloguj się ponownie.

---

## 16. Wskazówki bezpieczeństwa

- `.env` nie może być commitowany,
- sekrety do GHCR i deployu powinny być w GitHub Secrets,
- baza danych nie powinna być wystawiona publicznie,
- frontend powinien być jedynym publicznym entrypointem HTTP.

---

## 17. Recovery po utracie VM

Minimalna procedura:
1. przygotuj nową VM z Docker i Docker Compose,
2. odtwórz `/opt/library3` oraz `.env`,
3. ustaw `IMAGE_TAG=sha-...`,
4. pobierz obrazy z GHCR,
5. odtwórz DB z backupu,
6. uruchom migracje, jeśli są wymagane,
7. wykonaj `up -d`,
8. wykonaj smoke test.

---

## 18. Checklist on-call

- [ ] czy `/api/health` odpowiada?
- [ ] czy `docker compose ps --all` pokazuje healthy?
- [ ] czy przejrzano ostatnie 200 linii logów backendu?
- [ ] czy DB nie zgłasza błędów OOM / braku miejsca / corruption?
- [ ] czy ostatni deploy zawierał migracje?
- [ ] czy potrzebny jest rollback do poprzedniego `sha-...`?

---

## 19. Referencje operacyjne

Powiązane dokumenty repo:
- `docs/ISSUES_DEVOPS_library3_MVP.md`
- workflow CI / publish / deploy w `.github/workflows/`
- pliki compose produkcyjne i init w katalogu głównym repo
