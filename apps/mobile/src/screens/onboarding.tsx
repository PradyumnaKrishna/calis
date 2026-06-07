import {useRef, useState} from 'react';

import {Pressable, ScrollView, Text, View} from 'react-native';

import {useQuery} from '@tanstack/react-query';
import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeWindFeather} from '../components/nativewind-feather';
import {OnboardingHint} from '../components/onboarding/hint';
import {ProgressBar} from '../components/progress-bar';
import {type QuestionnaireStep, fetchOnboardingQuestionnaire} from '../lib/api';

type AnswerValue = string | string[];

function hasStepAnswer(step: QuestionnaireStep, answers: Record<string, AnswerValue>) {
  const answer = answers[step.id];

  if (step.type === 'single') {
    return typeof answer === 'string';
  }

  return Array.isArray(answer) && answer.length >= (step.minSelections ?? 0);
}

function toggleMultiChoice(currentAnswer: AnswerValue | undefined, optionId: string) {
  const selectedIds = Array.isArray(currentAnswer) ? currentAnswer : [];

  if (optionId === 'none') {
    return selectedIds.includes(optionId) ? [] : [optionId];
  }

  const selectableIds = selectedIds.filter((selectedId) => selectedId !== 'none');

  return selectableIds.includes(optionId)
    ? selectableIds.filter((selectedId) => selectedId !== optionId)
    : [...selectableIds, optionId];
}

export function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    data: questionnaire,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['onboarding-questionnaire'],
    queryFn: fetchOnboardingQuestionnaire,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <Text className="text-base font-semibold text-foreground-light dark:text-foreground-dark">
            Loading onboarding...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !questionnaire) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center gap-4 p-6">
          <Text className="text-xl font-bold text-foreground-light dark:text-foreground-dark">
            Onboarding is unavailable
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-12 w-32 items-center justify-center rounded-full bg-foreground-light dark:bg-foreground-dark"
            onPress={() => refetch()}>
            <Text className="text-base font-semibold text-background-light dark:text-background-dark">
              Retry
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const steps = questionnaire.steps;
  const step = steps[stepIndex];
  const selected = answers[step.id];
  const progress = (stepIndex + 1) / steps.length;
  const isLastStep = stepIndex === steps.length - 1;
  const canContinue = hasStepAnswer(step, answers);

  function selectOption(optionId: string) {
    if (step.type === 'multi') {
      setAnswers((current) => {
        return {...current, [step.id]: toggleMultiChoice(current[step.id], optionId)};
      });

      return;
    }

    setAnswers((current) => ({...current, [step.id]: optionId}));

    if (isLastStep) {
      return;
    }

    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
    }

    advanceTimer.current = setTimeout(() => {
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, 180);
  }

  function continueToNextStep() {
    if (!canContinue || isLastStep) {
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="relative flex-1 p-6">
        <View className="mb-6 flex-row items-center gap-4">
          {stepIndex > 0 ? (
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center"
              onPress={goBack}>
              <NativeWindFeather
                className="text-primary-light dark:text-primary-dark"
                name="arrow-left"
                size={24}
              />
            </Pressable>
          ) : null}
          <ProgressBar value={progress} />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-6">
          <Text className="mb-3 text-xs font-semibold uppercase text-muted-light dark:text-muted-dark">
            {step.eyebrow}
          </Text>
          <Text className="max-w-sm text-3xl font-bold leading-9 text-foreground-light dark:text-foreground-dark">
            {step.question}
          </Text>

          <View className="mt-6 gap-4">
            {step.options.map((option) => {
              const isSelected = Array.isArray(selected)
                ? selected.includes(option.id)
                : selected === option.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{selected: isSelected}}
                  className={[
                    'min-h-12 w-full max-w-sm items-center justify-center self-start rounded-full border px-6 py-3',
                    isSelected
                      ? 'border-foreground-light bg-foreground-light dark:border-foreground-dark dark:bg-foreground-dark'
                      : 'border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark',
                  ].join(' ')}
                  key={option.id}
                  onPress={() => selectOption(option.id)}>
                  <Text
                    className={[
                      'text-center text-base font-semibold',
                      isSelected
                        ? 'text-background-light dark:text-background-dark'
                        : 'text-foreground-light dark:text-foreground-dark',
                    ].join(' ')}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {step.type === 'multi' ? (
            <View className="mt-8 w-full max-w-sm flex-row justify-end">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{disabled: !canContinue}}
                className={[
                  'h-12 w-36 items-center justify-center rounded-full',
                  canContinue
                    ? 'bg-foreground-light dark:bg-foreground-dark'
                    : 'bg-border-light dark:bg-border-dark',
                ].join(' ')}
                disabled={!canContinue}
                onPress={continueToNextStep}>
                <Text className="text-base font-semibold text-background-light dark:text-background-dark">
                  {isLastStep ? 'Finish' : 'Continue'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <OnboardingHint eyebrow={step.eyebrow} hint={step.hint} />
      </View>
    </SafeAreaView>
  );
}
