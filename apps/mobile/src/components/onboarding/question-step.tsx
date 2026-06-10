import {Pressable, Text, View} from 'react-native';

import Animated, {FadeInDown, FadeInUp, LinearTransition} from 'react-native-reanimated';

import type {components} from '../../lib/api-schema';
import {TextAnswerInput} from './text-answer-input';

type OnboardingQuestion = components['schemas']['OnboardingQuestion'];
type Answers = NonNullable<components['schemas']['OnboardingRequest']['answers']>;
type Answer = Answers[string];

type QuestionStepProps = {
  disabled: boolean;
  onSelect: (optionId: string) => void;
  onTextChange: (value: string) => void;
  question: OnboardingQuestion;
  selected: Answer | undefined;
};

export function QuestionStep({
  disabled,
  onSelect,
  onTextChange,
  question,
  selected,
}: QuestionStepProps) {
  const textValue = typeof selected === 'string' ? selected : '';

  return (
    <Animated.View
      entering={FadeInUp.duration(280)}
      key={question.id}
      layout={LinearTransition.duration(220)}>
      <Text className="mb-3 text-xs font-semibold uppercase text-muted-light dark:text-muted-dark">
        Onboarding
      </Text>
      <Text className="max-w-sm text-3xl font-bold leading-9 text-foreground-light dark:text-foreground-dark">
        {question.label}
      </Text>

      {question.type === 'text' ? (
        <TextAnswerInput disabled={disabled} onChangeText={onTextChange} value={textValue} />
      ) : (
        <View className="mt-6 gap-4">
          {(question.options ?? []).map((option, optionIndex) => {
            const isSelected = Array.isArray(selected)
              ? selected.includes(option.id)
              : selected === option.id;

            return (
              <Animated.View
                entering={FadeInDown.delay(optionIndex * 45).duration(260)}
                key={option.id}
                layout={LinearTransition.duration(220)}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{disabled, selected: isSelected}}
                  className={[
                    'min-h-12 w-full max-w-sm items-center justify-center self-start rounded-full border px-6 py-3',
                    isSelected
                      ? 'border-foreground-light bg-foreground-light dark:border-foreground-dark dark:bg-foreground-dark'
                      : 'border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark',
                  ].join(' ')}
                  disabled={disabled}
                  onPress={() => onSelect(option.id)}>
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
              </Animated.View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}
