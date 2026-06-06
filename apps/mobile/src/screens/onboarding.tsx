import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHint } from '../components/onboarding/hint';
import { ProgressBar } from '../components/progress-bar';
import { NativeWindFeather } from '../components/nativewind-feather';

type OnboardingOption = {
  id: string;
  label: string;
};

type OnboardingStep = {
  eyebrow: string;
  question: string;
  hint: string;
  options: OnboardingOption[];
};

const steps: OnboardingStep[] = [
  {
    eyebrow: 'Start point',
    question: 'What are you trying to achieve first?',
    hint: 'This sets the direction of your plan. Strength, skills, and mobility need different starting progressions.',
    options: [
      { id: 'strength', label: 'Get stronger' },
      { id: 'pullups', label: 'Learn pull-ups' },
      { id: 'handstand', label: 'Learn handstands' },
      { id: 'mobility', label: 'Improve mobility' },
    ],
  },
  {
    eyebrow: 'Push strength',
    question: 'How many clean push-ups can you do?',
    hint: 'Clean reps matter more than maximum effort. This helps estimate your pressing baseline.',
    options: [
      { id: 'push-0', label: '0' },
      { id: 'push-1-4', label: '1-4' },
      { id: 'push-5-14', label: '5-14' },
      { id: 'push-15-29', label: '15-29' },
      { id: 'push-30', label: '30+' },
    ],
  },
  {
    eyebrow: 'Pull strength',
    question: 'What can you currently do for pulling?',
    hint: 'Pulling ability decides whether the plan starts with rows, hangs, negatives, or full pull-up progressions.',
    options: [
      { id: 'no-bar', label: 'No bar access' },
      { id: 'no-hang', label: 'Cannot hang yet' },
      { id: 'hang-short', label: 'Hang under 10 sec' },
      { id: 'hang-long', label: 'Hang 10-30 sec' },
      { id: 'pull-1-4', label: '1-4 pull-ups' },
      { id: 'pull-5', label: '5+ pull-ups' },
    ],
  },
  {
    eyebrow: 'Setup',
    question: 'What equipment do you have access to?',
    hint: 'Equipment does not make the plan harder. It prevents the app from recommending progressions you cannot train.',
    options: [
      { id: 'none', label: 'None' },
      { id: 'bar', label: 'Pull-up bar' },
      { id: 'parallettes', label: 'Parallel bars' },
      { id: 'rings', label: 'Rings' },
    ],
  },
];

export function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const step = steps[stepIndex];
  const selected = answers[step.question];
  const progress = (stepIndex + 1) / steps.length;
  const isLastStep = stepIndex === steps.length - 1;
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function selectOption(optionId: string) {
    setAnswers((current) => ({ ...current, [step.question]: optionId }));

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
              onPress={goBack}
            >
              <NativeWindFeather className="text-primary-light dark:text-primary-dark" name="arrow-left" size={24} />
            </Pressable>
          ) : null}
          <ProgressBar value={progress} />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
          <Text className="mb-3 text-xs font-semibold uppercase text-muted-light dark:text-muted-dark">{step.eyebrow}</Text>
          <Text className="max-w-sm text-3xl font-bold leading-9 text-foreground-light dark:text-foreground-dark">{step.question}</Text>

          <View className="mt-6 gap-4">
            {step.options.map((option) => {
              const isSelected = selected === option.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={[
                    'h-12 w-64 items-center justify-center self-start rounded-full border px-6',
                    isSelected
                      ? 'border-foreground-light bg-foreground-light dark:border-foreground-dark dark:bg-foreground-dark'
                      : 'border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark',
                  ].join(' ')}
                  key={option.id}
                  onPress={() => selectOption(option.id)}
                >
                  <Text
                    className={[
                      'text-center text-base font-semibold',
                      isSelected ? 'text-background-light dark:text-background-dark' : 'text-foreground-light dark:text-foreground-dark',
                    ].join(' ')}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <OnboardingHint eyebrow={step.eyebrow} hint={step.hint} />
      </View>
    </SafeAreaView>
  );
}
