# Library (monorepo)

Monorepo:
- `frontend/` — Next.js (port 3000)
- `backend/` — Node.js + Express (port 4000, prefix `/api`)
- `db/` — PostgreSQL (port hosta 5434 -> 5432 w kontenerze)

## Branching
Używamy uproszczonej strategii:
- `main` — stabilne
- `feature/<obszar>-<opis>` — prace funkcjonalne

## Konwencje
- Conventional Commits (np. `chore:`, `feat:`, `fix:`, `docs:`)
- PR musi przejść Quality Gate (docelowo CI + lokalnie przez Docker Compose)

## Lokalny dev (Docker Compose)
Wymagania: Docker + Docker Compose

```bash
docker compose up --build

## Wymagania (źródło prawdy)
Priorytet wymagań: `LibraryP.docx` (MVP/kontrakt).