import {onboardingQuestionnaireSeed, seedQuestionnaire} from './questionnaire';

export async function seedDatabase() {
  await seedQuestionnaire(onboardingQuestionnaireSeed);
}

if (import.meta.main) {
  await seedDatabase();
}
