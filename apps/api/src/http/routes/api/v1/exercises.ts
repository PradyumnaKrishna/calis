import {Hono} from 'hono';
import {ExerciseModel} from '../../../../models/exercise';

export const exerciseRoutes = new Hono();

exerciseRoutes.get('/exercises', async (c) => {
  const exercises = await ExerciseModel.findMany();

  return c.json({data: exercises});
});

exerciseRoutes.get('/exercises/:slug', async (c) => {
  const exercise = await ExerciseModel.findBySlug(c.req.param('slug'));

  if (!exercise) {
    return c.json({error: {message: 'Exercise not found'}}, 404);
  }

  return c.json(exercise);
});
