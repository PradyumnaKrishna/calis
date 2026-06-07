# Calis API

FastAPI backend for Calis.

## Setup

```sh
python3 -m venv .venv
.venv/bin/pip install -e .
.venv/bin/calis-api-seed
```

## Development

```sh
.venv/bin/uvicorn src.main:app --reload --host 0.0.0.0 --port 3001
```

## Data

The local SQLite database defaults to `.data/calis.sqlite`. Override it with:

```sh
DATABASE_URL="file:./.data/calis.sqlite"
```

Exercise seed data lives in `src/scripts/seed_data/exercises.json`.

Apply migrations without seeding:

```sh
.venv/bin/calis-api-migrate
```

Seed applies migrations first, then replaces questionnaire and exercise seed rows.
For a fresh local SQLite database:

```sh
.venv/bin/calis-api-seed --reset
```

## Layout

```text
migrations/ migrations managed by Alembic
src/
  core/       app configuration and database session setup
  models/     SQLModel table models
  routes/     FastAPI routers
  schemas/    request and response models
  scripts/    seed and import commands, plus seed data
  services/   application logic
```
