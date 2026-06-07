import exerciseSeeds from './data/exercises.json';
import {ExerciseModel, type ExerciseSeed} from '../../src/models/exercise';

export async function seedExercises() {
  await ExerciseModel.seed(exerciseSeeds as ExerciseSeed[]);
}
