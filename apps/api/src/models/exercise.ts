import {prisma} from './client';

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

export type ExerciseSeed = Exercise & {
  source: string;
  sourceExerciseId: string;
  raw: unknown;
};

type ExerciseRecord = {
  id: string;
  source: string;
  sourceExerciseId: string;
  name: string;
  slug: string;
  bodyPartsJson: string;
  equipmentJson: string;
  targetMusclesJson: string;
  secondaryMusclesJson: string;
  instructionsJson: string;
  gifUrl: string;
  localGifPath: string;
};

function parseJsonArray(value: string): string[] {
  const parsed = JSON.parse(value) as unknown;

  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
}

function fromRecord(record: ExerciseRecord): Exercise {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    bodyParts: parseJsonArray(record.bodyPartsJson),
    equipment: parseJsonArray(record.equipmentJson),
    targetMuscles: parseJsonArray(record.targetMusclesJson),
    secondaryMuscles: parseJsonArray(record.secondaryMusclesJson),
    instructions: parseJsonArray(record.instructionsJson),
    gifUrl: record.gifUrl,
    localGifPath: record.localGifPath,
  };
}

export const ExerciseModel = {
  async findMany(): Promise<Exercise[]> {
    const exercises = await prisma.exercise.findMany({
      orderBy: [{name: 'asc'}],
    });

    return exercises.map(fromRecord);
  },

  async findBySlug(slug: string): Promise<Exercise | null> {
    const exercise = await prisma.exercise.findUnique({
      where: {slug},
    });

    return exercise ? fromRecord(exercise) : null;
  },

  async seed(exercises: ExerciseSeed[]) {
    await prisma.$transaction(async (tx) => {
      for (const exercise of exercises) {
        await tx.exercise.upsert({
          where: {id: exercise.id},
          create: {
            id: exercise.id,
            source: exercise.source,
            sourceExerciseId: exercise.sourceExerciseId,
            name: exercise.name,
            slug: exercise.slug,
            bodyPartsJson: JSON.stringify(exercise.bodyParts),
            equipmentJson: JSON.stringify(exercise.equipment),
            targetMusclesJson: JSON.stringify(exercise.targetMuscles),
            secondaryMusclesJson: JSON.stringify(exercise.secondaryMuscles),
            instructionsJson: JSON.stringify(exercise.instructions),
            gifUrl: exercise.gifUrl,
            localGifPath: exercise.localGifPath,
            rawJson: JSON.stringify(exercise.raw),
          },
          update: {
            source: exercise.source,
            sourceExerciseId: exercise.sourceExerciseId,
            name: exercise.name,
            slug: exercise.slug,
            bodyPartsJson: JSON.stringify(exercise.bodyParts),
            equipmentJson: JSON.stringify(exercise.equipment),
            targetMusclesJson: JSON.stringify(exercise.targetMuscles),
            secondaryMusclesJson: JSON.stringify(exercise.secondaryMuscles),
            instructionsJson: JSON.stringify(exercise.instructions),
            gifUrl: exercise.gifUrl,
            localGifPath: exercise.localGifPath,
            rawJson: JSON.stringify(exercise.raw),
          },
        });
      }
    });
  },
};
