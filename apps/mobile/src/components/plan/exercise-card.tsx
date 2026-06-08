import {type ComponentProps} from 'react';

import {Image, Pressable, Text, View} from 'react-native';

import {getApiAssetUrl} from '../../lib/api';
import type {components} from '../../lib/api-schema';
import {NativeWindFeather} from '../nativewind-feather';

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

function instructionSteps(instructions: string) {
  return instructions
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean);
}

type ExerciseCardProps = {
  exercise: PlanExercise;
  isComplete: boolean;
  onToggleComplete: (exerciseId: string) => void;
};

export function ExerciseCard({exercise, isComplete, onToggleComplete}: ExerciseCardProps) {
  const steps = instructionSteps(exercise.instructions);

  return (
    <View className="flex-1 bg-background-light px-6 pb-6 pt-5 dark:bg-background-dark">
      <View className="flex-row items-start gap-3">
        <View
          className={[
            'h-10 w-10 items-center justify-center rounded-full',
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
            name={isComplete ? 'check' : (movementIcons[exercise.movementPattern] ?? 'activity')}
            size={20}
          />
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-black leading-8 text-foreground-light dark:text-foreground-dark">
            {exercise.name}
          </Text>
          <Text className="mt-1 text-sm font-bold text-muted-light dark:text-muted-dark">
            {exercisePrescription(exercise)} · {exercise.restSeconds}s rest
          </Text>
        </View>
      </View>

      <View className="mt-5">
        <View className="gap-1.5">
          {steps.slice(0, 4).map((step, stepIndex) => (
            <View className="flex-row gap-3" key={`${exercise.exerciseId}-${stepIndex}`}>
              <Text className="w-5 text-sm font-black text-muted-light dark:text-muted-dark">
                {stepIndex + 1}.
              </Text>
              <Text className="flex-1 text-sm font-medium leading-5 text-foreground-light dark:text-foreground-dark">
                {step}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="flex-1 items-center justify-center py-5">
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`${exercise.name} demonstration`}
          resizeMode="contain"
          source={{uri: getApiAssetUrl(exercise.gif)}}
          style={{
            alignSelf: 'center',
            flex: 1,
            width: '100%',
          }}
        />
      </View>

      {isComplete ? (
        <View className="mt-3 rounded-lg bg-success-surface-light p-3 dark:bg-success-surface-dark">
          <Text className="text-sm font-black text-success-light dark:text-success-dark">
            Completed. Do the next.
          </Text>
        </View>
      ) : null}

      {!isComplete ? (
        <Pressable
          accessibilityRole="button"
          className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-full bg-foreground-light dark:bg-foreground-dark"
          onPress={() => onToggleComplete(exercise.exerciseId)}>
          <NativeWindFeather
            className="text-background-light dark:text-background-dark"
            name="check"
            size={18}
          />
          <Text className="text-base font-black text-background-light dark:text-background-dark">
            Mark complete
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
