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

Seed applies migrations first, then replaces exercise seed rows.
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

## AI Onboarding

Profile reads are the bootstrap step. `GET /api/v1/profile` creates a
non-onboarded profile when no `X-Profile-Id` is present, and returns `401` when
the supplied profile id is invalid.

Onboarding is profile-scoped and requires `X-Profile-Id`. It uses one generic
question/answer contract:

```http
GET /api/v1/onboarding
POST /api/v1/onboarding
```

`GET /onboarding` returns the current questions. `POST /onboarding` stores
answers for those questions. The backend may ask more AI-generated questions, or
complete onboarding and mark `profiles.onboarded = true`.

Completed onboarding returns:

```json
{
  "status": "completed",
  "profile": {
    "profileId": "profile_123",
    "level": "beginner",
    "currentPlanLevel": "beginner",
    "currentVolumeTier": "low",
    "onboarded": true,
    "streak": 0
  }
}
```

Set `GEMINI_API_KEY` to enable Gemini. `GEMINI_MODEL` defaults to
`gemini-2.5-flash`. Without an API key, the service uses a local fallback for
development.
