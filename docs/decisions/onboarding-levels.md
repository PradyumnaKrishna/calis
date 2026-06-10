# Onboarding Levels

## Current Direction

Onboarding is profile-scoped. The mobile app first calls `GET /profile` to get
or create a profile id, stores that id locally, and then calls onboarding with
that profile id.

The onboarding API exposes one generic concept:

- Questions
- Answers
- Status

The backend can internally know whether a question is static or AI-generated,
but the API response does not split questions into initial or follow-up groups.

## First Questions

The first question set contains two text questions:

1. What is your goal?
2. What is your current level?

After those answers are submitted, the onboarding AI service may generate more
questions. Those questions can be `text`, `select`, or `multi_select`. Some
questions can be optional.

## Completion

When enough answers are collected, the AI service returns a structured
assessment:

```json
{
  "level": "intermediate",
  "goal": "pullups",
  "trainingDays": 3,
  "equipment": ["pullup_bar"],
  "constraints": [],
  "rationale": "User can handle basic volume and wants pull-up progressions."
}
```

The backend validates the assessment, updates durable profile fields, and marks
`profiles.onboarded = true`.

## Level Buckets

Use four simple product levels:

| Level | Label | Meaning |
| --- | --- | --- |
| 0 | Foundation | Needs very basic movement and confidence-building progressions. |
| 1 | Beginner | Can do some basics, but needs standard progressions and volume. |
| 2 | Intermediate | Has enough baseline strength to start skill-specific progressions. |
| 3 | Advanced | Already strong across basics and wants harder skill work. |

## Conservative Defaults

The AI should be conservative when the user's answers are uncertain, uneven, or
include discomfort. Pain and discomfort should influence constraints and may cap
the starting level, but the app should not diagnose injuries.

If Gemini is not configured, the backend uses a local fallback that generates
basic questions and assigns a reasonable level from text cues.
