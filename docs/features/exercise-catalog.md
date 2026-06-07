# Exercise Catalog

## Goal

Build a small, app-owned exercise catalog that the API can serve and the plan engine can use later.

The first version should stay intentionally narrow. We only store fields the app needs now, and we can add muscles, equipment, safety metadata, progression links, or programming defaults once the plan engine needs them.

## Categories

High-level app categories:

- Upper
- Back
- Core
- Legs
- Mobility
- Other

Movement patterns:

- Push
- Pull
- Squat
- Hinge
- Core
- Balance
- Mobility

## API Direction

Use an exercise API for ingestion, not for live plan generation.

The importer should copy exercise data into our seed file and normalize fields for our app. The API should read from our database, not from the external provider at request time.

Candidate APIs:

- ExerciseDB: useful because it exposes body part, target, equipment, instructions/media-style exercise data.
- API Ninjas Exercises API: useful because it supports exercise search by muscle, type, and difficulty.

## App-Specific Fields We Need

- `id`
- `slug`
- `name`
- `bodyRegion`
- `movementPattern`
- `difficulty`
- `level`
- `gif`
- `instructions`

`instructions` is stored as one text field with newline-separated steps. The UI can split it for step rendering.

## Database Table

The exercise table should be a single catalog table for now:

```text
exercises

id
slug
name
body_region
movement_pattern
difficulty
level
gif
instructions
created_at
updated_at
```

`difficulty` is a simple numeric placement from 1 to 5. `level` is the app-facing placement: `foundation`, `beginner`, `intermediate`, or `advanced`.

## Deferred Fields

Do not add these yet:

- Muscles
- Equipment
- Safety tags
- Progression links
- Programming defaults
- Raw provider payload

These can be added with migrations when the product flow needs them.

## Open Questions

- Which API should we use first?
- How much manual curation do we need before exercise levels feel accurate?
- Should progressions eventually be modeled as links between exercises or as named progression groups?
