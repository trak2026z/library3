# docs/azure/runbook.md

# Azure VM Runbook (library3) — GHCR + Docker Compose + HTTP-only

Ten runbook opisuje operacje wdrożeniowe na **jednej VM** w Azure (MVP):
- publiczny dostęp: **HTTP :80**
- backend + postgres bez publicznych portów (tylko wewnątrz sieci Dockera)
- obrazy: **GHCR** (`library3-frontend`, `library3-backend`, `library3-backend-init`)
- deploy automatyczny: **GitHub Actions** (`publish-ghcr` -> `deploy-azure-vm`) lub ręczny na VM

> Repo: `trak2026z/library3`

---

## 1) Architektura i pliki

### Usługi (compose prod)
- `db`: `postgres:16-alpine`
- `backend`: `ghcr.io/<owner>/library3-backend:<tag>`
- `frontend`: `ghcr.io/<owner>/library3-frontend:<tag>`

### Init / DB tasks (compose init)
- `migrate`: `ghcr.io/<owner>/library3-backend-init:<tag>` uruchamia `prisma migrate deploy`
- `seed`: `ghcr.io/<owner>/library3-backend-init:<tag>` uruchamia `prisma db seed`

### Pliki w repo
- `docker-compose.prod.yml`
- `docker-compose.prod.init.yml`
- `.env.prod.example`
- `.github/workflows/publish-ghcr.yml`
- `.github/workflows/deploy-azure-vm.yml`

---

## 2) Provisioning VM (portal, skrót decyzyjny)

### Zalecane parametry
- OS: Ubuntu 24.04 LTS (x64)
- Size: min. **2 vCPU / 8 GB RAM** (np. B2as_v2)
- Public IP: **Standard + Static**
- NSG inbound:
  - `80/tcp` z Internetu
  - `22/tcp` **tylko z Twojego IP** (idealnie)  
    Uwaga: jeśli deploy robisz przez GitHub Actions via SSH, to runner ma zmienne IP → patrz rozdział 8.

---

## 3) One-time setup na VM

### 3.1 SSH login
```bash
chmod 600 VM1_key.pem
ssh -i VM1_key.pem azureuser@<PUBLIC_IP>
```

### 3.2 Instalacja Docker + Compose (Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

### 3.3 Deploy katalog + repo + .env

```bash
sudo mkdir -p /opt/library3
sudo chown -R $USER:$USER /opt/library3

git clone https://github.com/trak2026z/library3.git /opt/library3
cd /opt/library3

cp .env.prod.example .env
nano .env
```

**Minimalna konfiguracja `.env` na VM**

```env
GHCR_OWNER=trak2026z
IMAGE_TAG=latest
PUBLIC_HTTP_PORT=80

# sekrety (ustaw mocne!)
POSTGRES_PASSWORD=CHANGE_ME_STRONG
JWT_SECRET=CHANGE_ME_STRONG
```

> `.env` nie commitujemy (jest ignorowany w `.gitignore`).

---

## 4) GHCR auth na VM (ręcznie)

Jeśli paczki są prywatne, potrzebujesz PAT z `read:packages` (czasem również `repo` dla tokens classic przy prywatnych zasobach).

```bash
echo "<GITHUB_PAT>" | docker login ghcr.io -u trak2026z --password-stdin
```

---

## 5) Ręczne wdrożenie na VM (pull → migrate → seed → up)

### 5.1 Pull obrazów

```bash
cd /opt/library3
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env pull
```

### 5.2 Migracje

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env --profile init run --rm -T migrate </dev/null
```

### 5.3 Seed (tylko pierwszy raz)

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env --profile init run --rm -T seed </dev/null
```

### 5.4 Start usług

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans db backend frontend
docker compose -f docker-compose.prod.yml --env-file .env ps --all
```

### 5.5 Smoke test (na VM)

```bash
curl -i http://localhost/api/health
curl -s "http://localhost/api/books?page=1&pageSize=5" | head
```

Z zewnątrz:

* `http://<PUBLIC_IP>/`
* `http://<PUBLIC_IP>/api/health`

---

## 6) Automatyczny deploy z GitHub Actions (workflow)

### 6.1 Wymagane GitHub Secrets (repo)

* `AZURE_VM_HOST` — publiczny IP VM
* `AZURE_VM_USER` — np. `azureuser`
* `AZURE_VM_SSH_KEY` — private key PEM (cały plik)
* `AZURE_VM_KNOWN_HOSTS` — wpis `known_hosts` dla VM (ed25519 wystarczy)
* `GHCR_USER` — `trak2026z`
* `GHCR_TOKEN_READ` — PAT z `read:packages`

### 6.2 Jak działa pipeline

* `publish-ghcr` (po merge do `main`) publikuje obrazy do GHCR (tagi: `latest` i `sha-<commit>`)
* `deploy-azure-vm` uruchamia się po sukcesie `publish-ghcr` i robi:

  * `pull`
  * `migrate`
  * `up -d db backend frontend`
  * weryfikacja `/api/health`

### 6.3 Pierwsze wdrożenie (seed)

Ręcznie uruchom:
**Actions → deploy-azure-vm → Run workflow**

* `image_tag`: `latest` (lub `sha-...`)
* `run_seed`: `true`

Następne wdrożenia: `run_seed=false`.

> Ważne: w zdalnym skrypcie `docker compose run` musi mieć `-T` i `</dev/null`, aby nie „zjadał” stdin SSH (inaczej skrypt ucina się po migrate).


---

## 7) Operacje eksploatacyjne (na VM)

### 7.1 Status i logi

```bash
cd /opt/library3

docker compose -f docker-compose.prod.yml --env-file .env ps --all

docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 backend
```

### 7.2 Restart pojedynczej usługi

```bash
cd /opt/library3

docker compose -f docker-compose.prod.yml --env-file .env restart backend
```

### 7.3 Aktualizacja do nowego obrazu (bez seed)

Założenie: `IMAGE_TAG` w `.env` wskazuje docelowy tag (np. `sha-<commit>` albo `latest`).

```bash
cd /opt/library3

docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env pull

docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env --profile init run --rm -T migrate </dev/null

docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans db backend frontend
```

### 7.4 Rollback (aplikacja)

1) Ustaw poprzedni `IMAGE_TAG` w `.env` (np. `sha-...`).
2) Wykonaj:

```bash
cd /opt/library3

docker compose -f docker-compose.prod.yml -f docker-compose.prod.init.yml --env-file .env pull

docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans db backend frontend
```

> Uwaga: rollback bazy danych zwykle nie jest automatyczny. Zakłada się migracje „forward-only” lub kompatybilność wsteczną aplikacji.

---

## 8) SSH/NSG przy deploy z GitHub Actions (zmienne IP runnerów)

Jeżeli deploy jest wykonywany przez SSH z hostowanych runnerów GitHub Actions, źródłowy adres IP może się zmieniać, co utrudnia restrykcyjne reguły NSG dla portu 22.

**Zalecane podejścia (od najbardziej do najmniej preferowanych):**

1) **Self-hosted runner** (uruchomiony na tej VM lub w tej samej sieci/VNet) — wówczas w NSG dopuszczasz 22 tylko z zaufanego zakresu/hosta.
2) **Kanał prywatny (VPN / bastion)** — np. Azure Bastion lub własny tunel VPN; unikasz otwierania 22 na Internet.
3) **Czasowe otwieranie 22** — tylko na czas deployu (automatyzowane) i natychmiastowe zamknięcie po deployu.
4) **Ograniczenie do IP GitHub** — możliwe, ale wymaga utrzymywania listy adresów publikowanych przez GitHub (zmienne w czasie) i aktualizacji reguł.

Minimalny wariant MVP (ręczne operacje):
- `80/tcp` otwarty publicznie,
- `22/tcp` ograniczony do Twojego IP (a przy deployu z CI przejście na jedno z podejść 1–3).
