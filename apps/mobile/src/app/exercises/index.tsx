import {type ComponentProps, useMemo} from 'react';

import {ActivityIndicator, Image, Pressable, ScrollView, Text, View} from 'react-native';

import {useQuery} from '@tanstack/react-query';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeWindFeather} from '../../components/nativewind-feather';
import {getApiAssetUrl, useApi} from '../../lib/api';
import type {components} from '../../lib/api-schema';

type Exercise = components['schemas']['ExercisePublic'];
type FeatherName = ComponentProps<typeof NativeWindFeather>['name'];

const movementIcons: Record<string, FeatherName> = {
  balance: 'aperture',
  core: 'target',
  hinge: 'corner-down-right',
  pull: 'arrow-down-circle',
  push: 'arrow-up-circle',
  squat: 'chevrons-down',
};

const levelRank: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function difficultyLabel(difficulty: number) {
  if (difficulty <= 2) {
    return 'Foundation';
  }

  if (difficulty <= 4) {
    return 'Building';
  }

  return 'Advanced';
}

function firstInstruction(instructions: string) {
  return instructions
    .split('\n')
    .map((step) => step.trim())
    .find(Boolean);
}

export default function ExercisesRoute() {
  const api = useApi();
  const router = useRouter();

  const {data, isError, isLoading, refetch} = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const {data: responseData, error} = await api.GET('/api/v1/exercises');

      if (error) {
        throw error;
      }

      return responseData.data;
    },
  });

  const exercisesByLevel = useMemo(() => {
    const grouped = new Map<string, Exercise[]>();

    for (const exercise of data ?? []) {
      const group = grouped.get(exercise.level) ?? [];

      group.push(exercise);
      grouped.set(exercise.level, group);
    }

    return Array.from(grouped.entries()).sort(
      ([left], [right]) => (levelRank[left] ?? 99) - (levelRank[right] ?? 99),
    );
  }, [data]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Loading exercises...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center gap-4 p-6">
          <Text className="text-2xl font-black text-foreground-light dark:text-foreground-dark">
            We could not load exercises
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="h-12 flex-row items-center justify-center gap-2 rounded-full bg-foreground-light px-6 dark:bg-foreground-dark"
              onPress={() => refetch()}>
              <NativeWindFeather color="#FFFFFF" name="refresh-cw" size={18} />
              <Text className="text-base font-semibold text-background-light dark:text-background-dark">
                Retry
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-full border border-border-light px-6 dark:border-border-dark"
              onPress={() => router.back()}>
              <Text className="text-base font-semibold text-foreground-light dark:text-foreground-dark">
                Back
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="h-16 flex-row items-center px-6">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center"
          onPress={() => router.back()}>
          <NativeWindFeather
            className="text-primary-light dark:text-primary-dark"
            name="arrow-left"
            size={24}
          />
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg font-black tracking-widest text-foreground-light dark:text-foreground-dark">
            EXERCISES
          </Text>
        </View>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-6 pb-8"
        showsVerticalScrollIndicator={false}>
        <View>
          <Text className="text-3xl font-black leading-9 text-foreground-light dark:text-foreground-dark">
            Exercise catalog
          </Text>
          <Text className="mt-2 text-base font-medium leading-6 text-muted-light dark:text-muted-dark">
            {data?.length ?? 0} bodyweight movements from the current training library.
          </Text>
        </View>

        {exercisesByLevel.map(([level, exercises]) => (
          <View className="gap-3" key={level}>
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-black text-foreground-light dark:text-foreground-dark">
                {titleCase(level)}
              </Text>
              <Text className="text-sm font-bold text-muted-light dark:text-muted-dark">
                {exercises.length}
              </Text>
            </View>

            {exercises.map((exercise) => (
              <ExerciseListCard exercise={exercise} key={exercise.id} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExerciseListCard({exercise}: {exercise: Exercise}) {
  const router = useRouter();
  const movementIcon = movementIcons[exercise.movementPattern] ?? 'activity';
  const cue = firstInstruction(exercise.instructions);

  return (
    <Pressable
      accessibilityLabel={`Open ${exercise.name}`}
      accessibilityRole="button"
      className="flex-row gap-4 rounded-lg border border-border-light p-3 dark:border-border-dark"
      onPress={() => router.push(`/exercises/${exercise.slug}` as never)}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={`${exercise.name} demonstration`}
        resizeMode="cover"
        source={{uri: getApiAssetUrl(exercise.gif)}}
        style={{
          backgroundColor: '#F1F0EF',
          borderRadius: 8,
          height: 92,
          width: 92,
        }}
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-start gap-2">
          <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
            <NativeWindFeather
              className="text-muted-light dark:text-muted-dark"
              name={movementIcon}
              size={16}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-black leading-5 text-foreground-light dark:text-foreground-dark">
              {exercise.name}
            </Text>
            <Text className="mt-1 text-sm font-bold text-muted-light dark:text-muted-dark">
              {titleCase(exercise.movementPattern)} · {titleCase(exercise.bodyRegion)}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          <View className="rounded-full bg-surface-light px-3 py-1 dark:bg-surface-dark">
            <Text className="text-xs font-black text-foreground-light dark:text-foreground-dark">
              {difficultyLabel(exercise.difficulty)}
            </Text>
          </View>
          <View className="rounded-full bg-warning-surface-light px-3 py-1 dark:bg-warning-surface-dark">
            <Text className="text-xs font-black text-warning-light dark:text-warning-dark">
              Difficulty {exercise.difficulty}
            </Text>
          </View>
        </View>

        {cue ? (
          <Text className="mt-3 text-sm font-medium leading-5 text-muted-light dark:text-muted-dark">
            {cue}
          </Text>
        ) : null}
      </View>
      <View className="h-8 items-center justify-center">
        <NativeWindFeather
          className="text-muted-light dark:text-muted-dark"
          name="chevron-right"
          size={18}
        />
      </View>
    </Pressable>
  );
}
