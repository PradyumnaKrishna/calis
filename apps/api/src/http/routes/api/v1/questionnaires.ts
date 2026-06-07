import {Hono} from 'hono';
import {QuestionnaireModel} from '../../../../models/questionnaire';

export const questionnaireRoutes = new Hono();

questionnaireRoutes.get('/onboarding/questionnaire', async (c) => {
  const questionnaire = await QuestionnaireModel.findActive();

  if (!questionnaire) {
    return c.json({error: {message: 'Questionnaire not found'}}, 404);
  }

  return c.json(questionnaire);
});
