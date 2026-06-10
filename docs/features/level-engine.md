# AI Level Assessment

## Goal

Assign the user's starting level from profile-scoped onboarding questions and
answers.

## API Flow

Profile loading is the bootstrap step:

```http
GET /api/v1/profile
```

If the request has no `X-Profile-Id`, the API creates a non-onboarded profile
and returns its id. If the request has an invalid profile id, the API returns
`401`.

Onboarding then requires `X-Profile-Id`:

```http
GET /api/v1/onboarding
POST /api/v1/onboarding
```

`GET /onboarding` returns the current question set:

```json
{
  "status": "in_progress",
  "questions": [
    {
      "id": "goal",
      "type": "text",
      "label": "What is your goal?",
      "required": true,
      "options": []
    }
  ]
}
```

`POST /onboarding` submits answers for the current questions:

```json
{
  "answers": {
    "goal": "I want my first pull-up",
    "current_level": "I can do 8 push-ups and hang for 15 seconds"
  }
}
```

The backend stores the questions and answers in `onboarding_sessions`. It can
return another generic question set or complete onboarding.

Completed response:

```json
{
  "status": "completed",
  "questions": [],
  "profile": {
    "profileId": "profile_123",
    "level": "intermediate",
    "currentPlanLevel": "intermediate",
    "currentVolumeTier": "low",
    "onboarded": true,
    "streak": 0
  }
}
```

## Question Types

Supported question types:

- `text`
- `select`
- `multi_select`

## AI Boundary

Gemini generates additional questions and the final structured assessment. The
backend validates the assessment before updating the durable profile fields:

- `goal`
- `level`
- `training_days`
- `equipment`
- `constraints`
- `onboarded`

When `GEMINI_API_KEY` is not configured, the backend uses a conservative local
fallback so local development remains functional.
