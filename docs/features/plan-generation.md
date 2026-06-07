# Plan Generation

## Goal

Create a cyclic plan for the user based on their level, goal, equipment, constraints, and training frequency.

## Plan Shape

A plan should be a repeating cycle. For example:

- 7-day cycle
- 2-4 workout days depending on the user's selected frequency
- Rest or mobility days between harder sessions

Each workout should have a small number of exercises:

- 4-6 exercises per workout
- Clear sets, reps, holds, and rest
- Exercises ordered from skill or strength work to easier accessory work

## Initial Thinking

Each level can have multiple sets before moving to the next level.

Example:

- Beginner set 1: lower volume
- Beginner set 2: more reps
- Beginner set 3: more sets
- Next level: harder progression

The app should usually increase reps before increasing sets. It should only move to harder exercises after the user completes the current set consistently.

## Feedback

The user can mark exercises or sessions as:

- Too hard
- Manageable
- Easy
- Pain
- Skipped

## Open Questions

- Should progression happen per exercise or for the whole plan?
- How many completed sessions are enough before increasing volume?
- Should the app generate a full week upfront or generate the next workout only?
