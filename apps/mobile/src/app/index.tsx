import {useEffect, useMemo, useState, type ComponentProps} from 'react';

import {ActivityIndicator, Image, Pressable, ScrollView, Text, View} from 'react-native';

import {FontAwesome5} from '@expo/vector-icons';
import {useQuery} from '@tanstack/react-query';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeWindFeather} from '../components/nativewind-feather';
import {ResetProfileButton} from '../components/reset-profile-button';
import {useApi} from '../lib/api';
import type {components} from '../lib/api-schema';
import {getStoredProfileId} from '../lib/profile-storage';

export default function HomeScreen() {
  const router = useRouter();
  const {data: profileId, isLoading} = useQuery({
    queryKey: ['stored-profile-id'],
    queryFn: getStoredProfileId,
  });

  useEffect(() => {
    if (!isLoading && !profileId) {
      router.replace('/onboarding' as never);
    }
  }, [isLoading, profileId, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileId) {
    return <DashboardScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 justify-center p-6">
        <ActivityIndicator color="#63635E" />
      </View>
    </SafeAreaView>
  );
}

const restDayImage = require('../../assets/images/rest-day.png');

type PlanExercise = components['schemas']['PlanExercise'];
type FeatherName = ComponentProps<typeof NativeWindFeather>['name'];

const days = [
  {day: 1, label: 'M'},
  {day: 2, label: 'T'},
  {day: 3, label: 'W'},
  {day: 4, label: 'Th'},
  {day: 5, label: 'F'},
  {day: 6, label: 'S'},
  {day: 7, label: 'Su'},
];

const movementIcons: Record<string, FeatherName> = {
  balance: 'aperture',
  core: 'target',
  hinge: 'corner-down-right',
  pull: 'arrow-down-circle',
  push: 'arrow-up-circle',
  squat: 'chevrons-down',
};

const exploreCards: {title: string; description: string; icon: FeatherName; route: string}[] = [
  {
    title: 'Exercises',
    description: 'Browse movement progressions, training cues, and form notes.',
    icon: 'activity',
    route: '/exercises',
  },
];

function todayAsPlanDay() {
  const day = new Date().getDay();

  return day === 0 ? 7 : day;
}

function exercisePrescription(exercise: PlanExercise) {
  if (exercise.holdSeconds) {
    return `${exercise.sets} sets x ${exercise.holdSeconds}s`;
  }

  return `${exercise.sets} sets x ${exercise.reps ?? 'steady'} reps`;
}

function DashboardScreen() {
  const api = useApi();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(todayAsPlanDay);

  const {
    data: fullPlan,
    isError: isFullPlanError,
    isLoading: isFullPlanLoading,
    refetch: refetchFullPlan,
  } = useQuery({
    queryKey: ['plan'],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/plans');

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const {
    data: profile,
    isError: isProfileError,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/profile');

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const selectedWorkout = useMemo(
    () => fullPlan?.workouts.find((workout) => workout.day === selectedDay),
    [fullPlan, selectedDay],
  );

  const isSelectedToday = selectedDay === todayAsPlanDay();

  const {
    data: todayPlan,
    isError: isTodayPlanError,
    isLoading: isTodayPlanLoading,
    refetch: refetchTodayPlan,
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
  const streakCount = profile?.streak ?? 0;
  const streakColor = streakCount > 0 ? '#2A7E3B' : '#D13415';

  if (isFullPlanLoading || isTodayPlanLoading || isProfileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Loading your plan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isFullPlanError || isTodayPlanError || isProfileError || !fullPlan) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center gap-4 p-6">
          <Text className="text-2xl font-bold text-foreground-light dark:text-foreground-dark">
            We could not load your plan
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-full bg-foreground-light px-6 dark:bg-foreground-dark"
              onPress={() => {
                refetchFullPlan();
                refetchTodayPlan();
                refetchProfile();
              }}>
              <Text className="text-base font-semibold text-background-light dark:text-background-dark">
                Retry
              </Text>
            </Pressable>
            <ResetProfileButton />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="relative flex-1 p-6">
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center self-center px-4 py-3" style={{maxWidth: 520}}>
            <View
              className="relative items-center justify-center"
              style={{
                borderColor: streakColor,
                borderRadius: 58,
                borderWidth: 8,
                height: 116,
                width: 116,
              }}>
              <View
                className="absolute -left-1 bottom-6 h-2 w-2"
                style={{backgroundColor: streakColor}}
              />
              <View
                className="absolute -left-3 bottom-2 h-3 w-3"
                style={{backgroundColor: streakColor}}
              />
              <View
                className="absolute right-0 top-1 h-2.5 w-2.5"
                style={{backgroundColor: streakColor}}
              />
              <View className="items-center justify-center">
                <View className="flex-row items-center justify-center gap-1">
                  <Text className="text-3xl font-black text-foreground-light dark:text-foreground-dark">
                    {streakCount}
                  </Text>
                  {streakCount > 0 ? (
                    <FontAwesome5 color={streakColor} name="bolt" size={26} solid />
                  ) : (
                    <NativeWindFeather color={streakColor} name="frown" size={28} />
                  )}
                </View>
                <Text className="mt-1 text-xs font-bold uppercase text-muted-light dark:text-muted-dark">
                  days
                </Text>
              </View>
            </View>

            <View className="flex-1" style={{marginLeft: 32, maxWidth: 320}}>
              <Text className="text-3xl font-black leading-9 text-foreground-light dark:text-foreground-dark">
                Welcome back!
              </Text>
              <Text className="mt-2 text-base font-medium leading-6 text-muted-light dark:text-muted-dark">
                {streakCount > 0
                  ? 'Keep your training habit moving with the next focused session.'
                  : 'No streak yet. Start with today’s plan or recover well on a rest day.'}
              </Text>
            </View>
          </View>

          <View className="mt-8">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-2xl font-black leading-8 text-foreground-light dark:text-foreground-dark">
                  {isTodayComplete
                    ? "Today's done"
                    : todaysWorkout
                      ? todaysWorkout.title
                      : 'Rest day'}
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
                  <Pressable
                    accessibilityLabel="Start today's plan"
                    accessibilityRole="button"
                    className="mt-3 flex-row items-center justify-center gap-1.5 py-2"
                    onPress={() => router.push('/plan' as never)}>
                    <Text className="text-center font-mono text-xs uppercase tracking-widest text-foreground-light dark:text-foreground-dark">
                      {"Start today's plan"}
                    </Text>
                    <NativeWindFeather
                      className="text-foreground-light dark:text-foreground-dark"
                      name="arrow-right"
                      size={14}
                    />
                  </Pressable>
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
          </View>

          <View className="mt-8 border-t border-border-light pt-6 dark:border-border-dark">
            <View className="flex-row justify-between">
              {days.map((item) => {
                const workout = fullPlan.workouts.find((candidate) => candidate.day === item.day);
                const isSelected = selectedDay === item.day;
                const selectedClassName = workout
                  ? 'border-warning-light bg-warning-surface-light dark:border-warning-dark dark:bg-warning-surface-dark'
                  : 'border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark';

                return (
                  <Pressable
                    accessibilityLabel={`${item.label} ${workout ? workout.title : 'Rest'}`}
                    accessibilityRole="button"
                    className={[
                      'h-16 w-14 items-center justify-center rounded-lg border py-2',
                      isSelected
                        ? selectedClassName
                        : 'border-transparent bg-background-light dark:bg-background-dark',
                    ].join(' ')}
                    key={item.day}
                    onPress={() => {
                      setSelectedDay(item.day);
                    }}>
                    <Text className="text-base font-bold text-foreground-light dark:text-foreground-dark">
                      {item.label}
                    </Text>
                    <View className="mt-2 h-5 items-center justify-center">
                      {workout ? (
                        <FontAwesome5 color="#AB6400" name="bolt" size={16} solid />
                      ) : (
                        <NativeWindFeather
                          className="text-border-light dark:text-border-dark"
                          name="minus"
                          size={18}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-9 gap-3">
            {!isSelectedToday ? (
              <View className="rounded-lg bg-surface-light p-4 dark:bg-surface-dark">
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1">
                    <Text className="text-xl font-black leading-7 text-foreground-light dark:text-foreground-dark">
                      {selectedWorkout ? selectedWorkout.title : 'Rest day'}
                    </Text>
                  </View>
                </View>

                {selectedWorkout ? (
                  <View className="mt-4 gap-3">
                    {selectedWorkout.exercises.map((exercise) => (
                      <View className="flex-row items-center gap-3" key={exercise.exerciseId}>
                        <View className="h-9 w-9 items-center justify-center rounded-lg bg-background-light dark:bg-background-dark">
                          <NativeWindFeather
                            className="text-muted-light dark:text-muted-dark"
                            name={movementIcons[exercise.movementPattern] ?? 'activity'}
                            size={18}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-bold text-foreground-light dark:text-foreground-dark">
                            {exercise.name}
                          </Text>
                          <Text className="mt-0.5 text-sm font-medium text-muted-light dark:text-muted-dark">
                            {exercisePrescription(exercise)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="mt-3 text-sm font-medium leading-5 text-muted-light dark:text-muted-dark">
                    No workout planned for this day. Use it for recovery, mobility, or easy walking.
                  </Text>
                )}
              </View>
            ) : null}

            <Text className="text-3xl font-black leading-9 text-foreground-light dark:text-foreground-dark">
              Keep building
            </Text>

            <View className="gap-3">
              {exploreCards.map((card) => (
                <Pressable
                  accessibilityRole="button"
                  className="min-h-24 flex-row items-center gap-4 rounded-lg border border-border-light p-4 dark:border-border-dark"
                  key={card.title}
                  onPress={() => router.push(card.route as never)}>
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
                    <NativeWindFeather
                      className="text-foreground-light dark:text-foreground-dark"
                      name={card.icon}
                      size={20}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground-light dark:text-foreground-dark">
                      {card.title}
                    </Text>
                    <Text className="mt-1 text-sm font-semibold leading-5 text-muted-light dark:text-muted-dark">
                      {card.description}
                    </Text>
                  </View>
                  <NativeWindFeather
                    className="text-muted-light dark:text-muted-dark"
                    name="chevron-right"
                    size={20}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
