import {type Questionnaire, QuestionnaireModel} from '../../src/models/questionnaire';

export const onboardingQuestionnaireSeed: Questionnaire = {
  id: 'calis-onboarding',
  version: 1,
  title: 'Calis onboarding',
  description:
    'Builds a starter profile from goal, ability, equipment, constraints, and training availability.',
  steps: [
    {
      id: 'primary_goal',
      type: 'single',
      eyebrow: 'Start point',
      question: 'What are you trying to achieve first?',
      hint: 'This sets the direction of your plan. Strength, skills, and mobility need different starting progressions.',
      options: [
        {id: 'strength', label: 'Get stronger'},
        {id: 'pullups', label: 'Learn pull-ups'},
        {id: 'handstand', label: 'Learn handstands'},
        {id: 'mobility', label: 'Improve mobility'},
        {id: 'general_fitness', label: 'Build general fitness'},
      ],
    },
    {
      id: 'push_ups',
      type: 'single',
      eyebrow: 'Push strength',
      question: 'How many clean push-ups can you do?',
      hint: 'Clean reps matter more than maximum effort. This helps estimate your pressing baseline.',
      options: [
        {id: 'push_0', label: '0', score: 0},
        {id: 'push_1_4', label: '1-4', score: 1},
        {id: 'push_5_14', label: '5-14', score: 2},
        {id: 'push_15_29', label: '15-29', score: 3},
        {id: 'push_30_plus', label: '30+', score: 4},
      ],
    },
    {
      id: 'pulling_capacity',
      type: 'single',
      eyebrow: 'Pull strength',
      question: 'What can you currently do for pulling?',
      hint: 'Pulling ability decides whether the plan starts with rows, hangs, negatives, or full pull-up progressions.',
      options: [
        {id: 'no_bar', label: 'No bar access', score: 0},
        {id: 'cannot_hang', label: 'Cannot hang yet', score: 0},
        {id: 'hang_under_10', label: 'Hang under 10 sec', score: 1},
        {id: 'hang_10_30', label: 'Hang 10-30 sec', score: 2},
        {id: 'pull_1_4', label: '1-4 pull-ups', score: 3},
        {id: 'pull_5_plus', label: '5+ pull-ups', score: 4},
      ],
    },
    {
      id: 'squat_capacity',
      type: 'single',
      eyebrow: 'Leg control',
      question: 'How many controlled bodyweight squats can you do comfortably?',
      hint: 'Squat control gives a simple lower-body signal and helps spot mobility or joint-limit starting points.',
      options: [
        {id: 'squat_uncomfortable', label: 'Cannot squat comfortably', score: 0},
        {id: 'squat_1_4', label: '1-4', score: 1},
        {id: 'squat_5_14', label: '5-14', score: 2},
        {id: 'squat_15_29', label: '15-29', score: 3},
        {id: 'squat_30_plus', label: '30+', score: 4},
      ],
    },
    {
      id: 'strength_background',
      type: 'single',
      eyebrow: 'Training history',
      question: 'Do you have recent strength training experience?',
      hint: 'This helps tune pacing. Weight training can help adaptation, but calisthenics progressions still start from bodyweight control.',
      options: [
        {id: 'none_recent', label: 'No recent strength training'},
        {id: 'occasional', label: 'Occasional gym or weights'},
        {id: 'consistent', label: 'Consistent strength training'},
        {id: 'heavy', label: 'Heavy strength training'},
      ],
    },
    {
      id: 'equipment',
      type: 'multi',
      eyebrow: 'Setup',
      question: 'What equipment do you have access to?',
      hint: 'Equipment does not make the plan harder. It prevents the app from recommending progressions you cannot train.',
      minSelections: 1,
      options: [
        {id: 'none', label: 'None'},
        {id: 'pullup_bar', label: 'Pull-up bar'},
        {id: 'parallettes', label: 'Parallel bars'},
        {id: 'rings', label: 'Rings'},
        {id: 'bands', label: 'Resistance bands'},
      ],
    },
    {
      id: 'constraints',
      type: 'multi',
      eyebrow: 'Comfort',
      question: 'Is anything uncomfortable or risky right now?',
      hint: 'This helps filter exercises and keeps the first plan conservative around sensitive joints or positions.',
      minSelections: 1,
      options: [
        {id: 'none', label: 'None'},
        {id: 'wrists', label: 'Wrists'},
        {id: 'shoulders', label: 'Shoulders'},
        {id: 'knees', label: 'Knees'},
        {id: 'lower_back', label: 'Lower back'},
      ],
    },
    {
      id: 'training_days',
      type: 'single',
      eyebrow: 'Pace',
      question: 'How often do you realistically want to train?',
      hint: 'Frequency adjusts pacing and weekly volume. It should not make the starting level look more advanced.',
      options: [
        {id: 'days_1', label: '1 day per week'},
        {id: 'days_2', label: '2 days per week'},
        {id: 'days_3', label: '3 days per week'},
        {id: 'days_4_plus', label: '4+ days per week'},
      ],
    },
  ],
};

export async function seedQuestionnaire(questionnaire: Questionnaire) {
  await QuestionnaireModel.seed(questionnaire);
}
