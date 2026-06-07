import {prisma} from './client';

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

type QuestionnaireRecord = {
  id: string;
  version: number;
  title: string;
  description: string;
  steps: {
    stepId: string;
    type: string;
    eyebrow: string;
    question: string;
    hint: string;
    minSelections: number | null;
    maxSelections: number | null;
    options: {
      optionId: string;
      label: string;
      score: number | null;
    }[];
  }[];
};

function fromRecord(record: QuestionnaireRecord): Questionnaire {
  return {
    id: record.id,
    version: record.version,
    title: record.title,
    description: record.description,
    steps: record.steps.map((step) => ({
      id: step.stepId,
      type: step.type as QuestionType,
      eyebrow: step.eyebrow,
      question: step.question,
      hint: step.hint,
      ...(step.minSelections === null ? {} : {minSelections: step.minSelections}),
      ...(step.maxSelections === null ? {} : {maxSelections: step.maxSelections}),
      options: step.options.map((option) => ({
        id: option.optionId,
        label: option.label,
        ...(option.score === null ? {} : {score: option.score}),
      })),
    })),
  };
}

export const QuestionnaireModel = {
  async findActive(): Promise<Questionnaire | null> {
    const questionnaire = await prisma.questionnaire.findFirst({
      where: {isActive: true},
      orderBy: {updatedAt: 'desc'},
      include: {
        steps: {
          orderBy: {position: 'asc'},
          include: {
            options: {
              orderBy: {position: 'asc'},
            },
          },
        },
      },
    });

    return questionnaire ? fromRecord(questionnaire) : null;
  },

  async seed(questionnaire: Questionnaire) {
    await prisma.$transaction(async (tx) => {
      await tx.questionnaire.upsert({
        where: {id: questionnaire.id},
        create: {
          id: questionnaire.id,
          version: questionnaire.version,
          slug: questionnaire.id,
          title: questionnaire.title,
          description: questionnaire.description,
          isActive: true,
        },
        update: {
          version: questionnaire.version,
          slug: questionnaire.id,
          title: questionnaire.title,
          description: questionnaire.description,
          isActive: true,
        },
      });

      await tx.questionnaireStep.deleteMany({
        where: {questionnaireId: questionnaire.id},
      });

      for (const [stepIndex, step] of questionnaire.steps.entries()) {
        await tx.questionnaireStep.create({
          data: {
            questionnaireId: questionnaire.id,
            stepId: step.id,
            position: stepIndex,
            type: step.type,
            eyebrow: step.eyebrow,
            question: step.question,
            hint: step.hint,
            minSelections: step.minSelections,
            maxSelections: step.maxSelections,
            options: {
              create: step.options.map((option, optionIndex) => ({
                optionId: option.id,
                position: optionIndex,
                label: option.label,
                score: option.score,
              })),
            },
          },
        });
      }
    });
  },
};
