# Onboarding Levels

## Current Direction

For the first version, onboarding should build a deterministic profile from a short question journey. We are not trying to finalize the perfect assessment yet. We only need enough signal to place the user into a reasonable starting path.

Later, we can ask an open prompt like "What is your end goal?" and use AI to choose better follow-up questions. Even then, the answers should map back into deterministic profile fields.

## Level Buckets

Use four simple product levels:

| Level | Label | Meaning |
| --- | --- | --- |
| 0 | Foundation | Needs very basic movement and confidence-building progressions. |
| 1 | Beginner | Can do some basics, but needs standard progressions and volume. |
| 2 | Intermediate | Has enough baseline strength to start skill-specific progressions. |
| 3 | Advanced | Already strong across basics and wants harder skill work. |

We can split these further later if the app needs more nuance, but four levels are enough for the first version.

## Question Journey

Training frequency alone is weak because it only tells us availability, not ability or intent. The journey should ask fewer but sharper questions:

1. What are you trying to achieve first?
   - Examples: get stronger, learn pull-ups, learn handstands, improve mobility, build general fitness.
   - Why: sets the direction of the plan.
   - Current decision: use fixed choices first, not free text.

2. What can you currently do comfortably?
   - Push-ups, pull-up or hang ability, squat comfort.
   - Why: estimates starting level from observable ability.
   - Current decision: start with push-up, pull-up, and squat signals. Add more checks only if these are not enough.

   Initial questions:

   - How many clean push-ups can you do?
     - 0
     - 1-4
     - 5-14
     - 15-29
     - 30+
   - What can you currently do for pulling?
     - I do not have bar access
     - I cannot hang yet
     - I can hang for less than 10 seconds
     - I can hang for 10-30 seconds
     - I can do 1-4 pull-ups
     - I can do 5+ pull-ups
   - How many controlled bodyweight squats can you do comfortably?
     - I cannot squat comfortably
     - 1-4
     - 5-14
     - 15-29
     - 30+

3. Do you have recent strength training experience?
   - No recent strength training
   - Occasional gym or weight training
   - Consistent strength training
   - Heavy strength training
   - Why: helps distinguish a total beginner from someone who may adapt faster, even if they are new to calisthenics.
   - Current decision: use this as supporting context, not the primary level signal.

4. What equipment do you have access to?
   - None, pull-up bar, parallel bars, rings, resistance bands.
   - Why: prevents recommending impossible progressions.

5. Is anything uncomfortable or risky right now?
   - Wrist, shoulder, knee, lower back, none.
   - Why: avoids unsafe starting recommendations.

6. How often do you realistically want to train?
   - 1, 2, 3, or 4+ days per week.
   - Why: adjusts plan pacing, not the user's ability level.

## Distinguishing Beginner vs Advanced

The main difference should come from observable bodyweight control:

- A new user struggles with basic reps, controlled range of motion, or safe positions.
- A beginner can perform some basics but has low volume or uneven ability.
- An intermediate user has solid push, pull, and squat ability and can start harder progressions.
- An advanced user has strong basics across patterns and can handle skill-specific or high-leverage work.

Weight training can help interpret the answers, but it should not override calisthenics ability. For example, someone who can deadlift or bench a lot may still need beginner wrist, shoulder, hanging, or balance progressions for calisthenics. The app can use weightlifting experience to adjust pacing or confidence, but the starting techniques should still be based on push-up, pull-up or hang, and squat signals.

## Deterministic Mapping

The current implementation sends selected option IDs to the backend:

```json
{
  "answers": {
    "push_ups": "push_5_14",
    "equipment": ["pullup_bar", "bands"]
  }
}
```

The backend maps those option IDs to server-side option scores and question weights. The level score is the cumulative sum of:

```text
option.score * question.weight
```

The response currently returns only the starting level:

```json
{
  "level": "intermediate"
}
```

Later, when we add profiles and persisted answers, we should map answers into:

- Goal
- Ability signals
- Strength training background
- Equipment
- Constraints
- Plan pace
- Starting level

For now, only options with scores affect the level. Goal, frequency, equipment, and constraints can remain unscored until the plan engine uses them.

## Open Questions

- Are push-up, pull-up or hang, and squat signals enough to assign a useful first level?
- Which constraints should cap the user's starting level?
- Which constraints should only filter or swap recommended techniques?
