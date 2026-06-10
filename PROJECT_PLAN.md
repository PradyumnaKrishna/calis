# Calisthenics Learning App Plan

## Product Direction

Build a React Native / Expo app that helps users learn calisthenics through a focused progression path. The app should avoid becoming a generic workout tracker. Its core promise is:

> Here are the few calisthenics techniques you should focus on next, based on your current level.

The experience should feel like a learning app: onboarding, recommended path, technique detail, tutorial media, completion, skipping, and progress.

## Assignment Fit

The assignment rewards product thinking, intuitive UI/UX, clean architecture, and implementation quality. Since frontend carries higher weight, the first milestone should be a polished Expo app using local data and shared business logic.

For now, there will be no AI integration. The recommendation system should be deterministic, explainable, and testable.

## Initial Monorepo Shape

```txt
calis/
  apps/
    mobile/          # Expo app
    api/             # FastAPI backend
  package.json
  bun.lock
  README.md
```

## First Build Order

Start with the frontend and local data. Do not build the backend first.

1. Scaffold the workspace.
2. Create Expo app in `apps/mobile`.
3. Create shared packages: `core`, `types`, and `data`.
4. Build onboarding with local state.
5. Generate a local learning path from questionnaire answers.
6. Build the learning path screen.
7. Build technique detail and progress actions.
8. Persist local progress.
9. Use the backend for question delivery, level scoring, and exercise catalog APIs.

## Frontend Milestones

### 1. Onboarding Questionnaire

Collect enough information to generate a useful path:

- Primary goal: strength, skill, mobility, general fitness
- Current ability: push-ups, pulling or hang capacity, squat comfort
- Equipment: none, pull-up bar, rings, parallel bars, resistance bands
- Training frequency
- Injuries or constraints

### 2. Learning Path Screen

Show only 5-8 techniques. Each item should include:

- Technique name
- Target muscle or skill category
- Current level
- Short reason why it was selected
- Status: active, completed, skipped

This is the core product screen.

### 3. Technique Detail Screen

Each technique should show:

- Tutorial GIF or image
- Instructions
- Target muscles
- Regression and progression
- Success criteria
- Actions: complete, skip, too hard, too easy

### 4. Progress Screen

Show:

- Overall path completion
- Current level
- Completed techniques
- Skipped techniques
- Optional streak or consistency indicator

## Backend Scoring

Keep deterministic scoring on the backend so the mobile app only submits selected option IDs. Scores and question weights stay server-side and can be tuned without changing the app.

Current level request:

```json
{
  "answers": {
    "push_ups": "push_5_14",
    "pulling_capacity": "hang_10_30",
    "equipment": ["pullup_bar", "bands"]
  }
}
```

Current level response:

```json
{
  "level": "intermediate"
}
```

The backend computes:

```txt
sum(option.score * question.weight)
```

## Seed Data Package

Use curated seed data before integrating any external exercise API.

```txt
packages/data/
  src/
    exercises.ts
    progressions.ts
```

Example progressions:

- Wall push-up
- Incline push-up
- Knee push-up
- Standard push-up
- Diamond push-up
- Archer push-up

Each exercise should include:

- ID
- Name
- Muscle group
- Difficulty level
- Equipment requirements
- Instructions
- Tutorial media URL
- Regression ID
- Progression ID

## Rule-Based Plan Generator

The app should generate recommendations using explicit rules.

Examples:

- If the user cannot do 5 push-ups, recommend incline push-ups before standard push-ups.
- If the user has a pull-up bar and wants upper-body strength, recommend dead hang, scapular pull, and negative pull-up.
- If the user has no equipment, avoid pull-up progressions unless an alternative is available.
- If the user reports knee pain, avoid deep squat progressions initially.
- Always return a focused path of 5-8 techniques.

## Backend Scope

Use the existing FastAPI backend for questionnaire delivery, level scoring, exercise catalog APIs, and future persistence.

Suggested stack:

```txt
FastAPI
SQLModel
SQLite first, Postgres later if needed
```

Initial backend APIs:

```txt
GET  /api/v1/onboarding/questionnaire
POST /api/v1/onboarding/level

GET  /api/v1/exercises

POST /api/plans/generate
GET  /api/plans/current
PATCH /api/plans/items/:id/status

POST /api/sessions
POST /api/sessions/:id/feedback
```

Backend responsibilities:

- Serve onboarding questions and options
- Score selected onboarding option IDs into a starting level
- Persist current learning plan
- Persist progress
- Serve exercise catalog
- Add profile and answer persistence later

## What To Avoid

- Do not start with authentication.
- Do not build a settings screen early.
- Do not dump a large exercise catalog into the main experience.
- Do not make it feel like a generic workout tracker.
- Do not add AI before the deterministic flow is working.
- Do not integrate external APIs until the curated seed data proves the UI flow.

## README Positioning

The README should explain that the app intentionally uses a deterministic progression engine first:

```txt
This version intentionally uses a deterministic progression engine instead of AI.
The goal is to keep recommendations explainable, testable, and appropriate for a fitness learning product.
```

## Near-Term Goal

The first useful version should let a user:

1. Complete onboarding.
2. Receive a focused beginner/intermediate learning path.
3. Open technique details.
4. Mark techniques complete or skipped.
5. See progress persist after reopening the app.
