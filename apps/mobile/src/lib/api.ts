const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export type QuestionType = 'single' | 'multi';

export type QuestionnaireOption = {
  id: string;
  label: string;
  score?: number;
};

export type QuestionnaireStep = {
  id: string;
  type: QuestionType;
  eyebrow: string;
  question: string;
  hint: string;
  minSelections?: number;
  maxSelections?: number;
  options: QuestionnaireOption[];
};

export type Questionnaire = {
  id: string;
  version: number;
  title: string;
  description: string;
  steps: QuestionnaireStep[];
};

export type Exercise = {
  id: string;
  name: string;
  slug: string;
  bodyParts: string[];
  equipment: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  gifUrl: string;
  localGifPath: string;
};

export async function fetchOnboardingQuestionnaire(): Promise<Questionnaire> {
  const response = await fetch(`${apiBaseUrl}/api/v1/onboarding/questionnaire`);

  if (!response.ok) {
    throw new Error('Unable to load onboarding questionnaire.');
  }

  return response.json() as Promise<Questionnaire>;
}

export async function fetchExercises(): Promise<Exercise[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/exercises`);

  if (!response.ok) {
    throw new Error('Unable to load exercises.');
  }

  const payload = (await response.json()) as {data: Exercise[]};

  return payload.data;
}
