import {useState} from 'react';

import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeWindFeather} from '../components/nativewind-feather';
import {OnboardingHint} from '../components/onboarding/hint';
import {ProgressBar} from '../components/progress-bar';
import {useApi} from '../lib/api';
import type {components} from '../lib/api-schema';
import {storeProfileId} from '../lib/profile-storage';

type Answers = components['schemas']['ProfileCreateRequest']['answers'];

export default function OnboardingScreen() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const {
    data: questionnaire,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['onboarding-questionnaire'],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/onboarding/questionnaire');

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async (nextAnswers: Answers) => {
      const {data, error} = await api.POST('/api/v1/onboarding/profile', {
        body: {answers: nextAnswers},
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async (profile) => {
      await storeProfileId(profile.profileId);
      queryClient.setQueryData(['stored-profile-id'], profile.profileId);
      queryClient.setQueryData(['profile', profile.profileId], profile);
      router.replace('/' as never);
    },
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
  const isLastStep = stepIndex === steps.length - 1;
  const isFullfilled =
    step.type === 'single'
      ? typeof selected === 'string'
      : Array.isArray(selected) && selected.length >= (step.minSelections ?? 0);

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function continueToNextStep() {
    if (step.type === 'multi' && !isFullfilled) {
      return;
    }

    if (isLastStep) {
      submit.mutate(answers);
    } else {
      setStepIndex((current) => current + 1);
    }
  }

  function selectOption(optionId: string) {
    if (step.type === 'multi') {
      setAnswers((current) => {
        const currentAnswer = current[step.id];
        const selectedIds = Array.isArray(currentAnswer) ? currentAnswer : [];
        let nextSelectedIds: string[];

        if (selectedIds.includes(optionId)) {
          nextSelectedIds = selectedIds.filter((selectedId) => selectedId !== optionId);
        } else if (selectedIds.length >= (step.maxSelections ?? step.options.length)) {
          nextSelectedIds = selectedIds;
        } else {
          nextSelectedIds = [...selectedIds, optionId];
        }

        return {...current, [step.id]: nextSelectedIds};
      });
    } else {
      const nextAnswers = {...answers, [step.id]: optionId};

      setAnswers(nextAnswers);

      if (isLastStep) {
        submit.mutate(nextAnswers);
      } else {
        setStepIndex((current) => current + 1);
      }
    }
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
          <ProgressBar value={(stepIndex + 1) / steps.length} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}>
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
                  accessibilityState={{disabled: submit.isPending, selected: isSelected}}
                  className={[
                    'min-h-12 w-full max-w-sm items-center justify-center self-start rounded-full border px-6 py-3',
                    isSelected
                      ? 'border-foreground-light bg-foreground-light dark:border-foreground-dark dark:bg-foreground-dark'
                      : 'border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark',
                  ].join(' ')}
                  disabled={submit.isPending}
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

          {step.type === 'single' && submit.isPending ? (
            <View className="mt-8 flex-row items-center gap-3">
              <ActivityIndicator color="#63635E" />
              <Text className="text-base font-semibold text-muted-light dark:text-muted-dark">
                Saving...
              </Text>
            </View>
          ) : null}

          {step.type === 'multi' ? (
            <View className="mt-8 w-full max-w-sm flex-row justify-end">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{disabled: !isFullfilled}}
                className={[
                  'h-12 w-36 items-center justify-center rounded-full',
                  isFullfilled && !submit.isPending
                    ? 'bg-foreground-light dark:bg-foreground-dark'
                    : 'bg-border-light dark:bg-border-dark',
                ].join(' ')}
                disabled={!isFullfilled || submit.isPending}
                onPress={continueToNextStep}>
                {submit.isPending ? (
                  <ActivityIndicator color="#FDFDFC" />
                ) : (
                  <Text className="text-base font-semibold text-background-light dark:text-background-dark">
                    {isLastStep ? 'Finish' : 'Continue'}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <OnboardingHint eyebrow={step.eyebrow} hint={step.hint} />
      </View>
    </SafeAreaView>
  );
}
