import {useCallback, useEffect, useRef, useState} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useRouter} from 'expo-router';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {NativeWindFeather} from '../components/nativewind-feather';
import {CarouselDots} from '../components/plan/carousel-dots';
import {ExerciseCard} from '../components/plan/exercise-card';
import {ResetProfileButton} from '../components/reset-profile-button';
import {useApi} from '../lib/api';
import {getStoredProfileId} from '../lib/profile-storage';

export default function PlanRoute() {
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

  if (profileId) {
    return <PlanContent profileId={profileId} />;
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 justify-center p-6">
        <ActivityIndicator color="#63635E" />
      </View>
    </SafeAreaView>
  );
}

type PlanContentProps = {
  profileId: string;
};

function PlanContent({profileId}: PlanContentProps) {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const {width: windowWidth} = useWindowDimensions();
  const cardScrollRef = useRef<ScrollView>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const {
    data: plan,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['today-plan', profileId],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/plans/today', {
        params: {
          header: {'X-Profile-Id': profileId},
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const activeWorkout = plan?.workout;
  const isTodayComplete = Boolean(plan?.completed);
  const completedExerciseIds = new Set(plan?.completedExerciseIds ?? []);
  const completePlanMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      const {data, error} = await api.POST('/api/v1/plans/today', {
        body: {exerciseId},
        params: {
          header: {'X-Profile-Id': profileId},
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (nextPlan) => {
      queryClient.setQueryData(['today-plan', profileId], nextPlan);
      queryClient.invalidateQueries({queryKey: ['plan', profileId]});
      queryClient.invalidateQueries({queryKey: ['profile', profileId]});
    },
  });

  function updateActiveCardIndex(offsetX: number) {
    if (windowWidth <= 0 || !activeWorkout) {
      return;
    }

    const nextIndex = Math.round(offsetX / windowWidth);
    const maxIndex = activeWorkout.exercises.length - 1;

    setActiveCardIndex(Math.max(0, Math.min(nextIndex, maxIndex)));
  }

  const goToCard = useCallback(
    (index: number) => {
      if (!activeWorkout) {
        return;
      }

      const nextIndex = Math.max(0, Math.min(index, activeWorkout.exercises.length - 1));

      setActiveCardIndex(nextIndex);
    },
    [activeWorkout],
  );

  useEffect(() => {
    cardScrollRef.current?.scrollTo({animated: true, x: activeCardIndex * windowWidth, y: 0});
  }, [activeCardIndex, windowWidth]);

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-background-light dark:bg-background-dark"
        edges={['top', 'bottom']}>
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Loading your plan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        className="flex-1 bg-background-light dark:bg-background-dark"
        edges={['top', 'bottom']}>
        <View className="flex-1 justify-center gap-4 p-6">
          <Text className="text-2xl font-bold text-foreground-light dark:text-foreground-dark">
            We could not load your plan
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-full bg-foreground-light px-6 dark:bg-foreground-dark"
              onPress={() => refetch()}>
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
    <View
      className="flex-1 bg-background-light dark:bg-background-dark"
      style={{
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: insets.top,
      }}>
      <View className="h-16 flex-row items-center px-6">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center"
          onPress={() => router.replace('/' as never)}>
          <NativeWindFeather
            className="text-primary-light dark:text-primary-dark"
            name="arrow-left"
            size={24}
          />
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg font-black tracking-widest text-foreground-light dark:text-foreground-dark">
            {"TODAY'S PLAN"}
          </Text>
        </View>
        <View className="h-10 w-10" />
      </View>

      {activeWorkout && isTodayComplete ? (
        <View className="flex-1 p-6">
          <View className="flex-1 items-center justify-center rounded-lg border border-success-border-light bg-success-surface-light p-6 dark:border-success-border-dark dark:bg-success-surface-dark">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-success-light dark:bg-success-dark">
              <NativeWindFeather color="#FFFFFF" name="check" size={34} />
            </View>
            <Text className="mt-5 text-center text-3xl font-black leading-9 text-foreground-light dark:text-foreground-dark">
              {"Today's plan is done"}
            </Text>
            <Text className="mt-3 text-center text-base font-semibold leading-6 text-muted-light dark:text-muted-dark">
              Come back tomorrow.
            </Text>
          </View>
        </View>
      ) : activeWorkout ? (
        <View className="flex-1">
          <ScrollView
            ref={cardScrollRef}
            className="flex-1"
            decelerationRate="fast"
            horizontal
            onMomentumScrollEnd={(event) =>
              updateActiveCardIndex(event.nativeEvent.contentOffset.x)
            }
            onScroll={(event) => updateActiveCardIndex(event.nativeEvent.contentOffset.x)}
            onScrollEndDrag={(event) => updateActiveCardIndex(event.nativeEvent.contentOffset.x)}
            pagingEnabled
            scrollEventThrottle={16}
            snapToAlignment="start"
            snapToInterval={windowWidth}
            showsHorizontalScrollIndicator={false}>
            {activeWorkout.exercises.map((exercise) => (
              <View className="flex-1" key={exercise.exerciseId} style={{width: windowWidth}}>
                <ExerciseCard
                  exercise={exercise}
                  isComplete={completedExerciseIds.has(exercise.exerciseId)}
                  onToggleComplete={completePlanMutation.mutate}
                />
              </View>
            ))}
          </ScrollView>

          <CarouselDots
            activeIndex={activeCardIndex}
            count={activeWorkout.exercises.length}
            onSelectIndex={goToCard}
          />
        </View>
      ) : (
        <View className="flex-1 p-6">
          <View className="flex-1 items-center justify-center rounded-lg border border-border-light p-6 dark:border-border-dark">
            <NativeWindFeather
              className="text-muted-light dark:text-muted-dark"
              name="coffee"
              size={36}
            />
            <Text className="mt-4 text-center text-2xl font-black text-foreground-light dark:text-foreground-dark">
              Rest day
            </Text>
            <Text className="mt-2 text-center text-base font-semibold leading-6 text-muted-light dark:text-muted-dark">
              No workout is available in this plan yet.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
