import {useEffect, useMemo, useState} from 'react';

import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeWindFeather} from '../components/nativewind-feather';
import {CompletedResult} from '../components/onboarding/completed-result';
import {OnboardingHint} from '../components/onboarding/hint';
import {QuestionStep} from '../components/onboarding/question-step';
import {ProgressBar} from '../components/progress-bar';
import {useApi} from '../lib/api';
import type {components} from '../lib/api-schema';
import {useProfile} from '../lib/use-profile';

type Answers = NonNullable<components['schemas']['OnboardingRequest']['answers']>;
type Answer = Answers[string];
type Profile = components['schemas']['ProfilePublic'];

export default function OnboardingScreen() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [completedProfile, setCompletedProfile] = useState<Profile | null>(null);

  const profileQuery = useProfile();

  const onboardingQuery = useQuery({
    enabled: Boolean(profileQuery.profile?.profileId && !profileQuery.profile.onboarded),
    queryKey: ['onboarding', profileQuery.profile?.profileId],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/onboarding');

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async (nextAnswers: Answers) => {
      const {data, error} = await api.POST('/api/v1/onboarding', {
        body: {answers: nextAnswers},
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async (response) => {
      if (response.status === 'completed' && response.profile) {
        setCompletedProfile(response.profile);
        queryClient.invalidateQueries({queryKey: ['profile']});
        return;
      }

      queryClient.setQueryData(['onboarding', profileQuery.profile?.profileId], response);
      setAnswers({});
      setStepIndex(0);
    },
  });

  const profile = completedProfile ?? profileQuery.profile;
  const questions = onboardingQuery.data?.questions ?? [];
  const question = questions[stepIndex];
  const selected = question ? answers[question.id] : undefined;
  const isLastStep = stepIndex === questions.length - 1;
  const canContinue = useMemo(() => {
    if (!question) {
      return false;
    }

    if (!question.required) {
      return true;
    }

    return hasAnswer(selected);
  }, [question, selected]);

  useEffect(() => {
    if (!profileQuery.profile) {
      return;
    }

    if (profileQuery.profile.onboarded && !completedProfile) {
      router.replace('/' as never);
    }
  }, [completedProfile, profileQuery.profile, router]);

  if (profile?.onboarded && completedProfile) {
    return (
      <CompletedResult
        profile={completedProfile}
        onStartTraining={() => router.replace('/' as never)}
      />
    );
  }

  if (profileQuery.isLoading || onboardingQuery.isLoading || !question) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Preparing onboarding...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileQuery.isError || onboardingQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center gap-4 p-6">
          <Text className="text-2xl font-bold text-foreground-light dark:text-foreground-dark">
            Onboarding is unavailable
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-12 w-32 items-center justify-center rounded-full bg-foreground-light dark:bg-foreground-dark"
            onPress={() => {
              profileQuery.refetch();
              onboardingQuery.refetch();
            }}>
            <Text className="text-base font-semibold text-background-light dark:text-background-dark">
              Retry
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function continueToNextStep() {
    if (!canContinue || submit.isPending) {
      return;
    }

    if (isLastStep) {
      submit.mutate(answers);
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function setAnswer(questionId: string, answer: Answer) {
    setAnswers((current) => ({...current, [questionId]: answer}));
  }

  function selectOption(optionId: string) {
    if (!question) {
      return;
    }

    if (question.type === 'multi_select') {
      const selectedIds = Array.isArray(selected) ? selected : [];
      const nextSelectedIds = selectedIds.includes(optionId)
        ? selectedIds.filter((selectedId) => selectedId !== optionId)
        : [...selectedIds, optionId];

      setAnswer(question.id, nextSelectedIds);
      return;
    }

    const nextAnswers = {...answers, [question.id]: optionId};

    setAnswers(nextAnswers);

    if (isLastStep) {
      submit.mutate(nextAnswers);
    } else {
      setStepIndex((current) => current + 1);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="relative flex-1 p-6">
        <View className="mb-8 flex-row items-center gap-4" style={{minHeight: 40}}>
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
          <ProgressBar value={(stepIndex + 1) / questions.length} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <QuestionStep
            key={question.id}
            disabled={submit.isPending}
            question={question}
            selected={selected}
            onSelect={selectOption}
            onTextChange={(value) => setAnswer(question.id, value)}
          />

          {submit.isError ? (
            <Text className="mt-5 max-w-sm text-base font-semibold leading-6 text-danger-light dark:text-danger-dark">
              Could not save your answer. Try again.
            </Text>
          ) : null}

          {question.type === 'text' || question.type === 'multi_select' || !question.required ? (
            <View className="mt-8 w-full max-w-sm flex-row justify-end">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{disabled: !canContinue}}
                className={[
                  'h-12 min-w-36 items-center justify-center rounded-full px-6',
                  canContinue && !submit.isPending
                    ? 'bg-foreground-light dark:bg-foreground-dark'
                    : 'bg-border-light dark:bg-border-dark',
                ].join(' ')}
                disabled={!canContinue || submit.isPending}
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

        {question.hintSummary && question.hintDescription ? (
          <OnboardingHint
            detail={question.hintDescription}
            eyebrow="Onboarding"
            summary={question.hintSummary}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function hasAnswer(answer: Answer | undefined) {
  if (typeof answer === 'string') {
    return answer.trim().length > 0;
  }

  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  return false;
}
