import {seedExercises} from './exercises';
import {onboardingQuestionnaireSeed, seedQuestionnaire} from './questionnaire';

export async function seedDatabase() {
  await seedQuestionnaire(onboardingQuestionnaireSeed);
  await seedExercises();
}

if (import.meta.main) {
  await seedDatabase();
}
