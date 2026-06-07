# Streaks

## Goal

Reward consistency without making users feel punished for planned rest days.

## Initial Thinking

The main streak should be based on planned activity, not forcing exercise every calendar day.

Useful streak types:

- Daily activity streak
- Weekly plan adherence
- Best streak

Rest days should preserve a plan adherence streak. Optional recovery or mobility work can preserve a daily activity streak.

## Events

Store streak events instead of only storing a number. That lets us recalculate streaks if the rules change.

Example events:

- Planned workout completed
- Mobility completed
- Rest day preserved
- Planned workout missed

## Open Questions

- Should daily streaks matter, or should weekly consistency be the main reward?
- Should users get a grace day?
- Should a skipped workout break the streak or pause it?
