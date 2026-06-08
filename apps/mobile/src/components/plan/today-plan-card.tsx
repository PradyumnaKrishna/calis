import {type ComponentProps} from 'react';

import {ActivityIndicator, Image, Pressable, Text, View} from 'react-native';

import {FontAwesome5} from '@expo/vector-icons';
import {useQuery} from '@tanstack/react-query';
import {useRouter} from 'expo-router';

import {useApi} from '../../lib/api';
import type {components} from '../../lib/api-schema';
import {NativeWindFeather} from '../nativewind-feather';

const restDayImage = require('../../../assets/images/rest-day.png');

type PlanExercise = components['schemas']['PlanExercise'];
type FeatherName = ComponentProps<typeof NativeWindFeather>['name'];

const movementIcons: Record<string, FeatherName> = {
  balance: 'aperture',
  core: 'target',
  hinge: 'corner-down-right',
  pull: 'arrow-down-circle',
  push: 'arrow-up-circle',
  squat: 'chevrons-down',
};

function exercisePrescription(exercise: PlanExercise) {
  if (exercise.holdSeconds) {
    return `${exercise.sets} sets x ${exercise.holdSeconds}s`;
  }

  return `${exercise.sets} sets x ${exercise.reps ?? 'steady'} reps`;
}

export function TodayPlanCard() {
  const api = useApi();
  const router = useRouter();

  const {
    data: todayPlan,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['today-plan'],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/plans/today');

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const todaysWorkout = todayPlan?.workout;
  const completedExerciseIds = new Set(todayPlan?.completedExerciseIds ?? []);
  const isTodayComplete = Boolean(todayPlan?.completed);

  if (isLoading) {
    return (
      <View className="mt-8 flex-row items-center gap-3">
        <ActivityIndicator color="#63635E" />
        <Text className="text-base font-semibold text-muted-light dark:text-muted-dark">
          Loading today&apos;s plan...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="mt-8 gap-3">
        <Text className="text-2xl font-black leading-8 text-foreground-light dark:text-foreground-dark">
          We could not load today&apos;s plan
        </Text>
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center self-start py-2"
          onPress={() => refetch()}>
          <Text className="font-mono text-xs uppercase tracking-widest text-foreground-light dark:text-foreground-dark">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mt-8">
      <Pressable
        accessibilityLabel="Start today's plan"
        accessibilityRole="button"
        onPress={() => router.push('/plan' as never)}>
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-black leading-8 text-foreground-light dark:text-foreground-dark">
              {isTodayComplete ? "Today's done" : todaysWorkout ? todaysWorkout.title : 'Rest day'}
            </Text>
            {isTodayComplete ? (
              <Text className="mt-1 text-base font-semibold text-muted-light dark:text-muted-dark">
                See you tomorrow.
              </Text>
            ) : null}
          </View>
          <View
            className={[
              'h-10 w-10 items-center justify-center rounded-full',
              isTodayComplete
                ? 'bg-success-surface-light dark:bg-success-surface-dark'
                : todaysWorkout
                  ? 'bg-warning-surface-light dark:bg-warning-surface-dark'
                  : 'bg-surface-light dark:bg-surface-dark',
            ].join(' ')}>
            {isTodayComplete ? (
              <NativeWindFeather
                className="text-success-light dark:text-success-dark"
                name="check"
                size={20}
              />
            ) : todaysWorkout ? (
              <FontAwesome5 color="#AB6400" name="bolt" size={18} solid />
            ) : (
              <NativeWindFeather
                className="text-muted-light dark:text-muted-dark"
                name="coffee"
                size={20}
              />
            )}
          </View>
        </View>

        {todaysWorkout ? (
          <View className="mt-4 gap-3">
            {todaysWorkout.exercises.map((exercise) => {
              const isComplete = completedExerciseIds.has(exercise.exerciseId);

              return (
                <View className="flex-row items-center gap-3" key={exercise.exerciseId}>
                  <View
                    className={[
                      'h-9 w-9 items-center justify-center rounded-full',
                      isComplete
                        ? 'bg-success-surface-light dark:bg-success-surface-dark'
                        : 'bg-surface-light dark:bg-surface-dark',
                    ].join(' ')}>
                    <NativeWindFeather
                      className={
                        isComplete
                          ? 'text-success-light dark:text-success-dark'
                          : 'text-muted-light dark:text-muted-dark'
                      }
                      name={
                        isComplete
                          ? 'check'
                          : (movementIcons[exercise.movementPattern] ?? 'activity')
                      }
                      size={18}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={[
                        'text-base font-bold',
                        isComplete
                          ? 'text-muted-light line-through dark:text-muted-dark'
                          : 'text-foreground-light dark:text-foreground-dark',
                      ].join(' ')}>
                      {exercise.name}
                    </Text>
                    <Text
                      className={[
                        'mt-0.5 text-sm font-semibold',
                        isComplete
                          ? 'text-muted-light line-through dark:text-muted-dark'
                          : 'text-muted-light dark:text-muted-dark',
                      ].join(' ')}>
                      {exercisePrescription(exercise)}
                    </Text>
                  </View>
                </View>
              );
            })}
            {!isTodayComplete ? (
              <View className="mt-3 flex-row items-center justify-center gap-1.5 py-2">
                <Text className="text-center font-mono text-xs uppercase tracking-widest text-foreground-light dark:text-foreground-dark">
                  {"Start today's plan"}
                </Text>
                <NativeWindFeather
                  className="text-foreground-light dark:text-foreground-dark"
                  name="arrow-right"
                  size={14}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <View className="mt-4">
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="Cartoon person resting on a couch"
              resizeMode="cover"
              source={restDayImage}
              style={{
                backgroundColor: '#F1F0EF',
                borderRadius: 8,
                height: 188,
                width: '100%',
              }}
            />
            <Text className="mt-4 text-base font-medium leading-6 text-muted-light dark:text-muted-dark">
              No workout scheduled today. Recover well so the next session feels stronger.
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
