# Level Engine

## Goal

Determine the user's starting level from onboarding answers.

## Inputs

- Onboarding answer IDs from the frontend
- Backend `questions` and `question_options` rows

## Output

- Starting level enum: `foundation`, `beginner`, `intermediate`, or `advanced`

Response shape:

```json
{
  "level": "intermediate"
}
```

## Initial Thinking

The level is calculated from selected option scores. Training frequency, goal, equipment, and constraints can affect later plan generation, but options without scores simply contribute `0` today.

For now, use simple scores from the questionnaire options:

- 0: foundation signal
- 1: beginner signal
- 2: low intermediate signal
- 3: intermediate signal
- 4: advanced signal

The level enum lives in the model. Answer evaluation and score-to-level mapping live in the backend scoring service.

## V1 Scoring Algorithm

The frontend sends selected option IDs only. It does not send scores.

Example request:

```json
{
  "answers": {
    "primary_goal": "pullups",
    "push_ups": "push_5_14",
    "pulling_capacity": "hang_10_30",
    "squat_capacity": "squat_15_29",
    "equipment": ["pullup_bar", "bands"]
  }
}
```

The backend:

1. Flattens all selected option IDs from the request.
2. Finds matching `question_options` by `optionId`.
3. Loads each option's parent `question`.
4. Calculates `sum((option.score || 0) * question.weight)`.
5. Maps the cumulative score to `Level`.

Question weight defaults to `1`. This lets us tune scoring later without changing the mobile app request.

Map cumulative score to `Level`:

| Score  | Level          |
| ------ | -------------- |
| `0-2`  | `foundation`   |
| `3-5`  | `beginner`     |
| `6-9`  | `intermediate` |
| `10+`  | `advanced`     |

## Open Questions

- Should one weak pattern cap the whole user level?
- Should the app show one global level, or separate push/pull/legs levels?
- Should constraints reduce level, or only filter exercises?
- Should we expose the numeric score later for debugging or keep only `level`?
