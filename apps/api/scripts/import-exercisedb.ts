import {mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';

type ExerciseDbExercise = {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
};

type ExerciseDbResponse = {
  success: boolean;
  meta: {
    hasNextPage: boolean;
    nextCursor?: string;
  };
  data: ExerciseDbExercise[];
};

const API_BASE_URL = 'https://oss.exercisedb.dev/api/v1/exercises';
const SOURCE = 'exercisedb-v1';
const CATALOG_SIZE = 48;
const REQUEST_DELAY_MS = 350;
const GIF_DELAY_MS = 150;
const MAX_RETRIES = 5;
const MAX_CATALOG_PAGES = 48;

const seedFilePath = path.resolve(import.meta.dir, '../prisma/seed/data/exercises.json');
const publicMediaDir = path.resolve(import.meta.dir, '../public/media/exercises');

const desiredNameHints = [
  'push-up',
  'knee push-up',
  'incline push-up',
  'decline push-up',
  'diamond push-up',
  'pike push-up',
  'pull-up',
  'chin-up',
  'hanging knee raise',
  'dip',
  'bench dip',
  'plank',
  'side plank',
  'mountain climber',
  'leg raise',
  'crunch',
  'reverse crunch',
  'sit-up',
  'squat',
  'jump squat',
  'lunge',
  'split squat',
  'glute bridge',
  'hip raise',
  'calf raise',
  'wall sit',
  'burpee',
  'jumping jack',
  'bear crawl',
  'superman',
  'bird dog',
  'cobra',
  'upward facing dog',
  'downward facing dog',
];

const excludedNameHints = [
  'impossible',
  'muscle up',
  'handstand',
  'clap',
  'one arm',
  'weighted',
  'neck',
  'stretch',
  'potty',
  'quads',
  '(male)',
  'cable machine',
  'isometric wipers',
  'donkey',
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function cleanInstruction(value: string) {
  return value.replace(/^Step:\d+\s*/i, '').trim();
}

function uniqueById(exercises: ExerciseDbExercise[]) {
  const seen = new Set<string>();

  return exercises.filter((exercise) => {
    if (seen.has(exercise.exerciseId)) {
      return false;
    }

    seen.add(exercise.exerciseId);
    return true;
  });
}

function scoreExercise(exercise: ExerciseDbExercise) {
  const name = exercise.name.toLowerCase();
  const desiredScore = desiredNameHints.reduce((score, hint, index) => {
    return name.includes(hint) ? score + 100 - index : score;
  }, 0);
  const strengthBias = ['push', 'pull', 'dip', 'squat', 'raise', 'row', 'plank', 'crawl'].some((hint) =>
    name.includes(hint),
  )
    ? 30
    : 0;
  const bodyPartScore = new Set(exercise.bodyParts).size * 4;
  const instructionScore = Math.min(exercise.instructions.length, 6);

  return desiredScore + strengthBias + bodyPartScore + instructionScore;
}

async function fetchCatalog() {
  let url: string | null = API_BASE_URL;
  const exercises: ExerciseDbExercise[] = [];
  let pagesFetched = 0;

  while (url && pagesFetched < MAX_CATALOG_PAGES) {
    let response: Response | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      response = await fetch(url, {
        headers: {'User-Agent': 'calis-exercisedb-importer/0.1'},
      });

      if (response.ok || response.status !== 429) {
        break;
      }

      const retryAfter = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 2500 * (attempt + 1);
      await sleep(delay);
    }

    if (!response?.ok) {
      throw new Error(`ExerciseDB request failed with ${response?.status ?? 'unknown'} for ${url}`);
    }

    const payload = (await response.json()) as ExerciseDbResponse;
    exercises.push(...payload.data);
    pagesFetched += 1;

    url = payload.meta.hasNextPage
      ? `${API_BASE_URL}?after=${encodeURIComponent(payload.meta.nextCursor ?? '')}`
      : null;

    if (url) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  return exercises;
}

async function downloadGif(exercise: ExerciseDbExercise) {
  const fileName = `${slugify(exercise.name)}-${exercise.exerciseId}.gif`;
  const filePath = path.join(publicMediaDir, fileName);
  const response = await fetch(exercise.gifUrl, {
    headers: {'User-Agent': 'calis-exercisedb-importer/0.1'},
  });

  if (!response.ok) {
    throw new Error(`GIF download failed with ${response.status} for ${exercise.gifUrl}`);
  }

  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  await sleep(GIF_DELAY_MS);

  return `/media/exercises/${fileName}`;
}

async function main() {
  await rm(publicMediaDir, {force: true, recursive: true});
  await mkdir(publicMediaDir, {recursive: true});

  const catalog = await fetchCatalog();
  const eligible = uniqueById(catalog)
    .filter((exercise) => exercise.equipments.includes('body weight'))
    .filter((exercise) => !excludedNameHints.some((hint) => exercise.name.toLowerCase().includes(hint)))
    .sort((left, right) => scoreExercise(right) - scoreExercise(left))
    .slice(0, CATALOG_SIZE * 3);

  const seeds = [];

  for (const exercise of eligible) {
    let localGifPath: string;

    try {
      localGifPath = await downloadGif(exercise);
    } catch (error) {
      console.warn(error instanceof Error ? error.message : error);
      continue;
    }

    seeds.push({
      id: `ex_${exercise.exerciseId}`,
      source: SOURCE,
      sourceExerciseId: exercise.exerciseId,
      name: titleCase(exercise.name),
      slug: slugify(exercise.name),
      bodyParts: exercise.bodyParts,
      equipment: exercise.equipments,
      targetMuscles: exercise.targetMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      instructions: exercise.instructions.map(cleanInstruction).filter(Boolean),
      gifUrl: exercise.gifUrl,
      localGifPath,
      raw: exercise,
    });

    if (seeds.length >= CATALOG_SIZE) {
      break;
    }
  }

  seeds.sort((left, right) => left.name.localeCompare(right.name));
  await writeFile(seedFilePath, `${JSON.stringify(seeds, null, 2)}\n`);

  console.log(`Imported ${seeds.length} exercises from ExerciseDB.`);
  console.log(`Seed data: ${seedFilePath}`);
  console.log(`GIF assets: ${publicMediaDir}`);
}

await main();
