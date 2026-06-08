import type {components} from './api-schema';

export type Level = components['schemas']['Level'];

export const LEVEL_ORDER: Level[] = ['foundation', 'beginner', 'intermediate', 'advanced'];

export const LEVEL_CONTENT: Record<
  Level,
  {
    dashboardDescription: string;
    label: string;
    resultDescription: string;
  }
> = {
  foundation: {
    label: 'Foundation',
    dashboardDescription: 'Build control, range, and confidence with starter progressions.',
    resultDescription:
      'Your plan will start with control, range, and confidence-building progressions.',
  },
  beginner: {
    label: 'Beginner',
    dashboardDescription: 'Grow consistency while strengthening core movement patterns.',
    resultDescription: 'Your plan will build consistency across the core calisthenics patterns.',
  },
  intermediate: {
    label: 'Intermediate',
    dashboardDescription: 'Progress toward harder variations with more volume and control.',
    resultDescription: 'Your plan will push volume, control, and harder movement variations.',
  },
  advanced: {
    label: 'Advanced',
    dashboardDescription: 'Train demanding progressions with higher skill and intensity.',
    resultDescription: 'Your plan will focus on demanding progressions with higher intensity.',
  },
};

export const LEVEL_ICON_NAMES: Record<Level, string> = {
  foundation: 'sprout',
  beginner: 'arm-flex-outline',
  intermediate: 'dumbbell',
  advanced: 'weight-lifter',
};
