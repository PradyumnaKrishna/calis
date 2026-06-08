import {type ComponentProps} from 'react';

import {ActivityIndicator, Image, Pressable, ScrollView, Text, View} from 'react-native';

import {useQuery} from '@tanstack/react-query';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeWindFeather} from '../../components/nativewind-feather';
import {getApiAssetUrl, useApi} from '../../lib/api';

type FeatherName = ComponentProps<typeof NativeWindFeather>['name'];

const movementIcons: Record<string, FeatherName> = {
  balance: 'aperture',
  core: 'target',
  hinge: 'corner-down-right',
  pull: 'arrow-down-circle',
  push: 'arrow-up-circle',
  squat: 'chevrons-down',
};

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function instructionSteps(instructions: string) {
  return instructions
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean);
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

export default function ExerciseDetailRoute() {
  const api = useApi();
  const router = useRouter();
  const params = useLocalSearchParams<{slug?: string | string[]}>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const {
    data: exercise,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    enabled: Boolean(slug),
    queryKey: ['exercise', slug],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/exercises/{slug}', {
        params: {
          path: {slug: slug ?? ''},
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
  });

  if (isLoading || !slug) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Loading exercise...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !exercise) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center gap-4 p-6">
          <Text className="text-2xl font-black text-foreground-light dark:text-foreground-dark">
            We could not load this exercise
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

  const steps = instructionSteps(exercise.instructions);
  const movementIcon = movementIcons[exercise.movementPattern] ?? 'activity';

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
            EXERCISE
          </Text>
        </View>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-8"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
            <NativeWindFeather
              className="text-muted-light dark:text-muted-dark"
              name={movementIcon}
              size={20}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-3xl font-black leading-9 text-foreground-light dark:text-foreground-dark">
              {exercise.name}
            </Text>
            <Text className="mt-1 text-base font-bold text-muted-light dark:text-muted-dark">
              {titleCase(exercise.movementPattern)} · {titleCase(exercise.bodyRegion)}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <MetadataItem value={titleCase(exercise.level)} />
          <MetadataDivider />
          <MetadataItem value={difficultyLabel(exercise.difficulty)} />
          <MetadataDivider />
          <MetadataItem value={`Difficulty ${exercise.difficulty}`} />
        </View>

        <View className="aspect-square w-full max-w-96 self-center">
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={`${exercise.name} demonstration`}
            resizeMode="contain"
            source={{uri: getApiAssetUrl(exercise.gif)}}
            style={{
              alignSelf: 'center',
              flex: 1,
              width: '100%',
              maxWidth: 480,
            }}
          />
        </View>

        <View className="mt-8">
          <Text className="text-xl font-black text-foreground-light dark:text-foreground-dark">
            Instructions
          </Text>
          <View className="mt-4 gap-3">
            {steps.map((step, index) => (
              <View className="flex-row gap-3.5" key={`${exercise.id}-${index}`}>
                <View className="h-6 w-6 items-center justify-center">
                  <Text className="text-sm font-black text-muted-light dark:text-muted-dark">
                    {index + 1}
                  </Text>
                </View>
                <Text className="min-w-0 flex-1 text-base font-semibold leading-6 text-foreground-light dark:text-foreground-dark">
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetadataItem({value}: {value: string}) {
  return (
    <Text className="text-sm font-black uppercase text-muted-light dark:text-muted-dark">
      {value}
    </Text>
  );
}

function MetadataDivider() {
  return <View className="h-1 w-1 rounded-full bg-border-light dark:bg-border-dark" />;
}
