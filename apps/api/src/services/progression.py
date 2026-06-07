from ..models import Level


LEVEL_ORDER = [
    Level.FOUNDATION,
    Level.BEGINNER,
    Level.INTERMEDIATE,
    Level.ADVANCED,
]


def next_level(level: Level) -> Level:
    level_index = LEVEL_ORDER.index(level)
    next_index = min(len(LEVEL_ORDER) - 1, level_index + 1)

    return LEVEL_ORDER[next_index]


def previous_level(level: Level) -> Level:
    level_index = LEVEL_ORDER.index(level)
    previous_index = max(0, level_index - 1)

    return LEVEL_ORDER[previous_index]
