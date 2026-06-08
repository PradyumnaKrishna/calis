# Streaks

## Goal

Reward completed planned workouts with a simple profile-level streak.

## Data Model

The profile stores:

- `streak`: current streak count.
- `current_plan_started_at`: timestamp for the active plan level and volume tier.

Workout completions store the plan context that was active when the workout was
completed:

- `plan_level`
- `volume_tier`

This lets missed-workout checks apply only to the current plan version. When a
user advances to the next volume tier or level, the active plan start timestamp
is reset.

## Rules

- A streak increments by `1` when the user completes all exercises in today's
  planned workout for the first time.
- Re-completing or toggling an already completed workout does not increment the
  streak again.
- The plan advances only after the user has completed more than `4` planned
  workouts in the current plan level and volume tier. After an upgrade, the
  count starts again for the new plan version.
- Rest days do not increment the streak.
- Rest days do not reset the streak.
- If any previous scheduled workout day in the current plan version is missed,
  the streak resets to `0`.
- Missed-day checks start at `current_plan_started_at`, so older misses from a
  previous plan level or volume tier do not reset the current streak.

## API Behavior

Profile reads reconcile the streak before returning data:

- `GET /api/v1/profile`

If this endpoint finds a missed previous workout in the current plan version, it
persists `streak = 0` and returns the reset value.

Workout completion updates the streak:

- `POST /api/v1/plans/today`

When today's workout becomes complete, the API increments `profile.streak` and
records the completion with the active plan context. If the current plan version
now has more than `4` completed workouts, the API advances the profile plan and
starts the next plan version.

## Client Behavior

The mobile dashboard reads `streak` from the profile API response and displays it
in the streak summary. Completing today's plan refreshes the cached profile data
so the dashboard can show the updated count.
